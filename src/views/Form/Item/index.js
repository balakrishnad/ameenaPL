/* eslint no-useless-computed-key: 0 */
/* eslint array-callback-return: 0 */
import { Link, Route, Switch } from 'react-router-dom';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { eachComponent } from 'formiojs/utils/formUtils';
import {
  getForm,
  selectRoot,
  getSubmissions,
  getSubmission,
  resetSubmission,
} from 'react-formio';

import View from './View';
import SignatureForm from './SignatureForm';
import Submission from './Submission/index';
import { i18next } from '../../../i18n';
import { getUserForms } from '../Actions/UserForms';
import routeService from '../../../services/routeService';
import {
  getFormName,
  getQueryObject,
  normalizeDataSetCategory,
  signatureOffline,
  getSubmissionDefaultQuery,
} from '../../../utils';
import { Forms , AppConfig, OfflinePluginConfig } from '../../../config';
import Form from '../../../containers/Form';
import Loading from '../../../containers/Loading';
// import FormioOfflineProject from 'formio-plugin-offline';
//import LogMessage from '../../../containers/LogFile';
// const offlinePlugin = FormioOfflineProject.getInstance(
//   AppConfig.projectUrl,
//   AppConfig.projectUrl,
//   OfflinePluginConfig
// );
const Item = class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      formId: '',
      filters: {
        date: '',
        line: '',
        plant: '',
        shift: '',
      },
      stateSubmission: {
        submission: {},
      },
      submissionId: '',
      outstandingTabData: {},
      form: {},
      gpid: null,
      location: '',
      otherformData: null,
      otherFormId: null,
      language: '',
    };
  }
  static propTypes = {
    auth: PropTypes.object,
    signatures: PropTypes.object,
    location: PropTypes.object,
    match:PropTypes.object,
    filters: PropTypes.object,
    submissions:PropTypes.object,
    getSignaturesData:PropTypes.func,
    languageParams: PropTypes.object,
    getSubmissions:PropTypes.func,
    resetSubmission:PropTypes.func,
    getSubmission:PropTypes.func,
    submission: PropTypes.object,
    getForm:PropTypes.func,
    getUserForms: PropTypes.func,
    form:PropTypes.object,
    userForms: PropTypes.shape({
      forms: PropTypes.array,
      dataSetList: PropTypes.array,
      approverForms: PropTypes.array,

    }),

  };
  static formDataReady = false;

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      match: {
        params: { formId },
      },
      filters,
      signatures: { submissions },
      auth: {
        user: { data: userData },
      },
      location: { pathname, search },
      resetSubmission,
      getSignaturesData,
      getSubmission,
      getSubmissions,
      getForm,
      getUserForms,
      form: { form },
    } = nextProps;
    if (formId !== prevState.formId) {
      getForm(formId);
    }

    if (prevState.gpid !== userData.gpid) {
       const gpid= userData.gpid? userData.gpid: 
      userData.nameID!== undefined ? parseInt(userData.nameID) : '';
      getUserForms(gpid, userData.email, userData, 1, {
        limit: 999999,
        type: 'form',
        sort: 'created',
      });
    }
    if(prevState.form.form !==form && form.type ==='resource'){
      getSubmissions(1, {
        limit: 999999,
      });
    }
    if (
      filters.date !== prevState.filters.date ||
      filters.shift !== prevState.filters.shift ||
      filters.line !== prevState.filters.line ||
      filters.plant !== prevState.filters.plant ||
      filters.fromDate !== prevState.filters.fromDate ||
      filters.toDate !== prevState.filters.toDate ||
      filters.formShift !== prevState.filters.formShift ||
      filters.submitter !== prevState.filters.submitter ||
      filters.formName !== prevState.filters.formName ||
      filters.approvalStatus !== prevState.filters.approvalStatus ||
      pathname + search !== prevState.location
    ) {
      const query = getQueryObject(filters, { limit: 999999 });

      getSignaturesData(1, { ...query, [ 'data.formId' ]: formId });
      let defaultQuery=getSubmissionDefaultQuery(form,filters,nextProps.userForms,formId);
      getSubmissions(1, { ...defaultQuery});
    
    }

    if (submissions.length && submissions[ 0 ]._id !== prevState.submissionId) {
      getSubmission(submissions[ 0 ]._id);
    } else {
      resetSubmission();
    }

    if (
      nextProps.form.form &&
      prevState.form.form &&
      nextProps.form.form._id !== prevState.form.form._id
    ) {
      Item.formDataReady = false;
    }

    if (
      !Item.formDataReady &&
      nextProps.form.form._id &&
      nextProps.filters.plant &&
      nextProps.userForms.dataSetList &&
      nextProps.userForms.dataSetList.length !== 0     
    ) {
      Item.formDataReady = true;

      eachComponent(
        nextProps.form.form.components,
        (component) => {
          if (component.type !== 'select') {
            return;
          }
          
          const values = Item.getSelectValuesFromDataSet(
            component,
            nextProps.userForms.dataSetList,
            nextProps.filters.plant,
            nextProps.languageParams.language
          );
          component.uniqueOptions = true;
          if (values.length) {
            component.data = { values };
          }
        },
        true
      );
    }

    if (nextProps.languageParams.language !== prevState.language) {
      Item.formDataReady = false;
    }

    return {
      form: nextProps.form,
      formId: nextProps.match.params.formId,
      filters: {
        ...nextProps.filters,
      },
      gpid: userData.gpid,
      location: pathname + search,
      language: nextProps.languageParams.language,
    };
  }

  static getSelectValuesFromDataSet(
    component,
    dataSet,
    plant,
    language
  ) {
    if (!dataSet || !plant) {
      return;
    }
    const finalDataSet = dataSet.filter(({ data }) =>
    data.plantId && data.plantId.includes(plant)
    );

    if (!finalDataSet) {
      return;
    }
    const values = [];
    finalDataSet.sort((a, b) => a.data.sequence - b.data.sequence);
    finalDataSet.forEach(({ data }) => {
     
      /* Changes for dropdown population, when more than one dropdown field in a form neeed to use same resource
         Dropdown API key to be same as resource with  number EG: flavourDropdown1 [LN]*/
      if (
        normalizeDataSetCategory(data.dataSetCategory) === component.key ||
        component.key.includes(normalizeDataSetCategory(data.dataSetCategory))
      ) {
        /*api name for language field in DataSet resource table to be same as that of the user language selected*/
        /*English -en Arabic -ar*/
        data[ language ]
          ? values.push(data[ language ])
          : values.push(data.dropDownName);
      }
    });

    return values.map((value) => ({ label: value, value }));
  }

  componentWillUnmount() {
    Item.formDataReady = false;
  }

  getButtonSettings = () => {
    return {
      showPrevious: false,
      showNext: false,
      showSubmit: false,
      showCancel: false,
    };
  };

  onFormChange = (change) => {
    const { outstandingTabData } = this.state;

    // Check for change in marked fields from outstanding tab
    if (
      change.changed &&
      change.changed.value &&
      change.changed.component.properties.outstandingDataField
    ) {
      const newOutstandingTabData = {
        [ change.changed.component.key ]: change.changed.value,
      };

      this.setState(() => {
        return {
          outstandingTabData: {
            ...outstandingTabData,
            ...newOutstandingTabData,
          },
        };
      });
    }
  };

  getAnotherFormData = () => {
    const {
      submissions: { submissions },
    } = this.props;
    const { otherFormId } = this.state; //otherformData -console warnings unused otherformData //
    if (
      submissions !== undefined &&
      submissions[ 0 ] &&
      submissions[ 0 ].form &&
      this.state.otherformData === null
    ) {
      //Check here for the correct form and then fetch data from the corresponding FROM form
      if (submissions[ 0 ].form === Forms[ otherFormId ].id) {
        this.setState(() => {
          return {
            otherformData: submissions,
          };
        });
      }
    }
  };
  // Load data for outstanding tab from existing submission
  getExistingSubmission = () => {
    const {
      submissions: { submissions },
      submission,
    } = this.props;

    if (submissions.length || submission.id) {
      return submissions.length ? submissions[ 0 ] : submission.submission;
    }

    return null;
  };

  getFormTitleData() {
    const {
      userForms: { forms: userForms },
      form: { form },
    } = this.props;
    let currentForm = {};
    const formTitleData = {
      title: form.title,
      category: '',
    };

    if (userForms.length) {
      currentForm = userForms.find(
        (userForm) => getFormName(userForm) === form.name
      );
      if (currentForm) {
        formTitleData.title = `${ currentForm.formReference } ${ i18next.t(
          currentForm.formNameDescription
        ) } `;
        formTitleData.category = `${ i18next.t(currentForm.dropDownName) } `;
        formTitleData.issueNo=  currentForm.issueNo!==undefined? currentForm.issueNo:undefined;
        formTitleData.formReference= currentForm.formReference!==undefined? currentForm.formReference:undefined;
        formTitleData.issueDate=  currentForm.issueDate!==undefined? currentForm.issueDate:undefined;
      }
    }

    return formTitleData;
  }

  render() {
    const {
      form: { isActive },
      signatures: { submissions: signatures },
      languageParams: { language },
      location,
      submissions: { submissions },
      submission,
    } = this.props;
    const {
      form: { form },
      outstandingTabData,
      otherformData,
      otherFormId,
    } = this.state;
    let tabs = [];
    let outstandingTab = false;

    if (form.display === 'wizard') {
      tabs = form.components.map((page, index) => {
        // Set header outstanding tab
        if (page.properties && page.properties.isOutstanding) {
          outstandingTab = page;
          outstandingTab.number = index;
        }
        return {
          title: page.title,
          key: page.key,
          index: index,
          properties: page.properties,
          hidden: page.hidden,
        };
      });
    }
    // Check here for the forms which need other form data fetch

    let formId;
    tabs.filter(function (tab) {
      if (
        tab.properties &&
        tab.properties.otherFormRef &&
        otherFormId == null
      ) {
        formId = tab.properties.otherFormRef;
      }
    });

    if (formId !== undefined && otherFormId == null) {
      this.setState({ otherFormId: formId });
    }
    if (otherFormId !== null) {
      this.getAnotherFormData();
    }
    let currentPage = routeService.getCurrentPageNumberFromLocation(location);
    if (location.pathname.includes('signature')) {
      currentPage = 'signature';
    }

    let isBlocked = false;
    if (signatures) {
      isBlocked = signatures.some(
        (signature) =>
          signature.data.formId === form._id &&
          (signature.data.userSignature || signature.data.userSignature === '')
      );
    }
    //  if (offlinePlugin.submissionQueue.length) {
    //   isBlocked =signatureOffline(formId,this.props.filters);
    // }

    // Hide dropdown while tab is not header outstanding
    const hideOutstandingTabStyle = {
      display: 'none',
    };
    if (this.outstandingTabWebform) {
      hideOutstandingTabStyle.display = 'block';
    }

    /**** Code is used to calculate the table lentgh to apply bootstrap class Dynamically to grid  */
    const isOutstandingCount = tabs.filter(function (tab) {
      return tab.properties && tab.properties.isOutstanding;
    });
    const cssAttrForTab = tabs.length + 1 - isOutstandingCount.length;
    /*****End*******/
  
    const annualForm=form && form.properties && form.properties.AnnualForm;
    const formTitleData = this.getFormTitleData();

    return (
        <div>
            <div className="frm-name">
                {i18next.t('{{category}}', {
            category: i18next.t(formTitleData.category),
          })}
                {i18next.t('{{title}}', { title: i18next.t(formTitleData.title) })}
                <div style={ { display:'flex' } }>
                    {formTitleData.formReference!==undefined?<div>Form No: {formTitleData.formReference}</div> :null}
                    {formTitleData.issueNo!==undefined?<div>/Issue No: {formTitleData.issueNo}</div> :null}
                    {formTitleData.issueDate!==undefined?<div>/Date: {formTitleData.issueDate}</div> :null}
                </div>
            </div>

            {typeof outstandingTab.number !== 'undefined' ? (
          isActive ? (
              <Loading />
          ) : (
              <Form
              style={ hideOutstandingTabStyle }
              form={ form }
              onChange={ this.onFormChange }
              submission={ this.getExistingSubmission() }
              options={ {
                ...{
                  templates: { wizardHeader: { form: ' ' } },
                  template: 'bootstrap',
                  iconset: 'fa',
                  buttonSettings: this.getButtonSettings(),
                  language: `${ language }`,
                },
              } }
              ref={ (instance) => {
                if (instance) {
                  instance.createPromise.then(() => {
                    this.outstandingTabWebform = instance.formio;

                    // Check if there any existing submission
                    this.outstandingTabWebform.disabled = !!(
                      submissions.length || submission.id
                    );
                    this.outstandingTabWebform.setPage(outstandingTab.number);
                  });
                }
              } }
            />
          )
        ) : null}
            <div className="pep-nav">
                <ul className="nav nav-tabs peptabs">
                    {form.display === 'wizard' ? (
              tabs.map((tab, index) => {
                if (tab.properties && tab.properties.isOutstanding) return null;
                return (
                    <li
                    className={ 'nav-item col-md-' + 12 / cssAttrForTab }
                    key={ tab.index }
                  >
                        <Link
                      className={ `nav-link form-panel ${
                        parseInt(currentPage) === index
                          ? 'form-panel-highlighted'
                          : ''
                      }` }
                      to={
                        tab.properties &&
                        tab.properties.display === 'commonForShift'
                          ? routeService.getPagePath.formPage(
                              language,
                              form._id,
                              tab.index
                            )
                          : routeService.getPagePath.submissionPage(
                              language,
                              form._id,
                              tab.index
                            )
                      }
                    >
                            {i18next.t(tab.title)}
                        </Link>
                    </li>
                );
              })
             
            ) : (form._id !== Forms.Signature.id && !annualForm)?(
                <li className={ 'nav-item pep-width6' }>
                    <Link
                  className={ `nav-link form-panel ${
                    parseInt(currentPage) === 0 ? 'form-panel-highlighted' : ''
                  }` }
                  to={ routeService.getPagePath.submission(language, form._id) }
                >
                        {i18next.t('Input Details')}
                    </Link>
                </li>
            ):(
                <li className={ 'nav-item col-md-12' }>
                    <Link
                  className={ `nav-link form-panel ${
                    parseInt(currentPage) === 0 ? 'form-panel-highlighted' : ''
                  }` }
                  to={ routeService.getPagePath.submission(language, form._id) }
                >
                        {i18next.t('Form Details')}
                    </Link>
                </li>
            )}
                    { form._id !== Forms.Signature.id && !annualForm ?(<li
              className={
                form.display === 'wizard'
                  ? 'nav-item col-md-' + 12 / cssAttrForTab
                  : 'nav-item pep-width6'
              }
            >
                        <Link
                  className={ `nav-link form-panel ${
                  currentPage === 'signature' ? 'form-panel-highlighted' : ''
                }` }
                to={ routeService.getPagePath.signature(language, form._id) }
              >
                            {i18next.t('End Shift')}
                        </Link>
                    </li>):''} 
                </ul>
                <div className="pep-gridview">
                    <Switch>
                        <Route
                exact
                path={ routeService.getPagePath.form(language, ':formId') }
                render={ (props) => (
                    <View
                    { ...props }
                    form={ this.state.form }
                    outstandingTabData={ outstandingTabData }
                    otherformData={ otherformData }
                    submissions={ submissions }
                  />
                ) }
              />
                        <Route
                path={ routeService.getPagePath.submission(language, ':formId') }
                render={ (props) => (
                    <Submission
                    { ...props }
                    form={ this.state.form }
                    isBlocked={ isBlocked }
                    otherformData={ otherformData }
                  />
                ) }
              />
                        <Route
                path={ routeService.getPagePath.signature(language, ':formId') }
                component={ SignatureForm }
              />
                    </Switch>
                </div>
            </div>
        </div>
    );
  }
};

const mapStateToProps = (state) => {
  return {
    form: selectRoot('form', state),
    filters: selectRoot('filters', state),
    languageParams: selectRoot('languageParams', state),
    submission: selectRoot('submission', state),
    submissions: selectRoot('submissions', state),
    signatures: selectRoot('signatures', state),
    // dataSet: selectRoot('dataSet', state),
    userForms: selectRoot('userForms', state),
    auth: selectRoot('auth', state),
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    getForm: (id) => dispatch(getForm('form', id)),
    getUserForms: (gpid, email, user, page, query = {}) =>
      dispatch(getUserForms(gpid, email, user, page, query)),
    getSignaturesData: (page, query) =>
      dispatch(getSubmissions('signatures', page, query, Forms.Signature.id)),
    getSubmission: (id) =>
      dispatch(getSubmission('signature', id, Forms.Signature.id)),
    resetSubmission: () => dispatch(resetSubmission('signature')),
    getSubmissions: (page, query) =>
      dispatch(
        getSubmissions('submissions', page, query, ownProps.match.params.formId)
      ),
  
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Item);
