/* eslint array-callback-return: 0 */
/* eslint no-undef: 0 */
import React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import { reportCalculations, getTotalInEditMode } from '../../helper';
import {
  selectRoot,
  resetSubmissions,
  saveSubmission,
  selectError,
  Errors,
} from 'react-formio';
import Form from '../../../../../containers/Form';
import { i18next } from '../../../../../i18n';
import moment from 'moment-timezone';
import { push } from 'connected-react-router';
import BottomControlButtons from '../../../../../containers/BottomControlButtons/BottomControlButtons';
import ImportantInstructions from '../../../../../containers/ImportantInstructions/ImportantInstructions';
import routeService from '../../../../../services/routeService';
import { PageTexts, UserMessages } from '../../../../../config';
import Message from '../../../../../containers/Message';
import { eachComponent } from 'formiojs/utils/formUtils';
const Edit = class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: 0,
      tabsLength: 0,
      submission: {},
      draftSubmission: { isDraftSubmission: true, invalidData: [] },
      editingSubmittedRecord: true,
      confirmSubmit: false,
      isLoaded: false,
      isButtonDisabled: false,
      disablingDone: false,
      fieldUpdated: false,
      formMessage: {
        text: '',
        type: '',
      },
    };
  }

  componentWillUnmount() {
    delete this.webform;
  }

  onChangeHandler = (change) => {
    const {
      location,
      filters,
      auth: { user },
      form: { form },
    } = this.props;
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    const date = moment(filters.date).format('YYYY-MM-DD[T]HH:mm:ss[.000Z]');

    if (change.changed) {
      delete change.changed.flags;
      delete change.changed.instance;
    }

    if (this.webform) {
      this.webform.submission.metadata = {
        viewPage: currentPage,
      };
      if(!(form && form.type==='resource')){
        this.webform.submission.data.date = date;
        this.webform.submission.data.shift = filters.shift;
        this.webform.submission.data.line = filters.line;
        this.webform.submission.data.plant = `${ filters.plant }`;
        this.webform.submission.data.gpid = user.data.gpid;
      }
      
    }

    if (change.changed) {
      let draftSubmission = this.state.draftSubmission;
      const editingSubmittedRecord = this.state.editingSubmittedRecord;

      if (
        this.isUniqueInWizardFormSubmissions() ||
        this.isUniqueInFormSubmissions()
      ) {
        const invalidValues = this.getInvalidUniqueInSubmissionsValues(change);

        if (invalidValues.length === 0) {
          if (
            !this.webform.savingDraft ||
            this.state.draftSubmission.invalidData.length > 0
          ) {
            this.webform.draftEnabled = true;
            this.webform.savingDraft = false;

            if (!editingSubmittedRecord) {
              this.webform.saveDraft();
            }
          }
          draftSubmission = { isDraftSubmission: true, invalidData: [] };
        } else {
          this.webform.options.saveDraft = false;
          this.webform.draftEnabled = false;
          this.webform.savingDraft = true;
          draftSubmission = {
            isDraftSubmission: false,
            invalidData: invalidValues,
          };
        }
        this.setState({ draftSubmission: draftSubmission });
      } else {
        if (this.webform && !this.webform.options.saveDraft) {
          this.webform.options.saveDraft = true;
          this.webform.draftEnabled = true;
          this.webform.savingDraft = false;

          if (!editingSubmittedRecord) {
            this.webform.saveDraft();
          }
        }
      }

      if (!isEqual(change.data, this.state.submission.data)) {
        let state =
          this.state.submission.state === 'submitted' ? 'submitted' : 'draft';
        if (
          (change.changed.value || change.changed.value === '') &&
          !change.changed.component.hidden &&
          change.changed.component.properties &&
          change.changed.component.properties.totalFor === undefined
        ) {
          state = 'draft';
        }

        this.setState((prevState) => {
          return {
            submission: {
              ...prevState.submission,
              ...change,
              data: {
                ...prevState.submission.data,
                ...change.data,
              },
            },
            editingSubmittedRecord: false,
          };
        });

        let viewOnlyTab = false;
        let informAboutDraft = false;
        if (
          this.webform &&
          this.webform.component.properties &&
          this.webform.component.properties.viewOnly === 'true'
        ) {
          viewOnlyTab = true;
        }
        if (state === 'draft' && !viewOnlyTab) {
          informAboutDraft = true;
        }

        this.setFormMessage(informAboutDraft);

        this.setState({ fieldUpdated: true });//added for displaying draft message once edited.
       //  window.scrollTo(0, 0);
      }
    }
  };

  onComponentChangeHandler = (newComponent) => {
    if (newComponent.component.type === 'tabs') {
      this.setState((prevState) => {
        return {
          ...prevState,
          currentTab: newComponent.instance.currentTab,
          tabsLength: newComponent.instance.tabs.length,
        };
      });
    }
  };

  getRequiredFields() {
    let requiredKeysString = [];

    if (this.webform) {
      if (this.webform.component.properties) {
        requiredKeysString = this.webform.component.properties
          .requiredInSubmission;
      } else if (this.webform.form.properties) {
        requiredKeysString = this.webform.form.properties.requiredInSubmission;
      }
    }

    return requiredKeysString && requiredKeysString.length
      ? requiredKeysString.split(',')
      : [];
  }

  getInvalidInSubmissionValues(newSubmission) {
    const requiredValues = this.getRequiredFields();

    return requiredValues.filter((uniqueValue) => {
      return !newSubmission.data[ uniqueValue ];
    });
  }

  isUniqueInWizardFormSubmissions() {
    return (
      this.webform &&
      this.webform.component.properties &&
      this.webform.component.properties.uniqueInSubmissions
    );
  }

  isUniqueInFormSubmissions() {
    return (
      this.webform &&
      this.webform.form.properties &&
      this.webform.form.properties.uniqueInSubmissions
    );
  }

  getUniqueInSubmissionsKeys() {
    let uniqueKeysString;

    if (this.isUniqueInWizardFormSubmissions()) {
      uniqueKeysString = this.webform.component.properties.uniqueInSubmissions;
    }
    if (this.isUniqueInFormSubmissions()) {
      uniqueKeysString = this.webform.form.properties.uniqueInSubmissions;
    }

    return uniqueKeysString.length ? uniqueKeysString.split(',') : [];
  }

  getInvalidUniqueInSubmissionsValues(newSubmission) {
    const {
      submissions: { submissions },
    } = this.props;
    const uniqueValues = this.getUniqueInSubmissionsKeys();

    return uniqueValues.filter((uniqueValue) =>
      submissions.some((sub) => {
        const isValuesEqual =
            sub.data[ uniqueValue ] === newSubmission.data[ uniqueValue ] &&
            sub._id !== newSubmission._id;

        return (
          sub.data[ uniqueValue ] &&
          isValuesEqual &&
          sub._id !== newSubmission._id &&
          sub.metadata &&
          newSubmission.metadata &&
          sub.metadata.viewPage === newSubmission.metadata.viewPage
        );
      })
    );
  }

  getFormDataToDisplay(otherformData, shiftToHrTab, currentPage, isFilter) {
    const {
      submission: { submission },
      submissions: { submissions },
      form: { form },
    } = this.props;
    const { submission: stateSubmission } = this.state;


    const submissionFromServer = submission;
    let mergedSubmission;

    /* Set data from `other forms` components to display in edit view of a record
       The FROM form component and TO form component should have property set as "formPick"
       TO Form - Property value should be the API  key of the FROM form component eg:formPick-paestatus
       FROM Form-Property value should be the API  key of the TO form component eg:formPick-pae*/

    if (submission.data) {
      let totalSubmission = {};

      if (shiftToHrTab) {
        submissions
          .filter(
            (item) =>
              item.metadata &&
              item.metadata.viewPage &&
              item.metadata.viewPage !== currentPage
          )
          .map((item) => {
            eachComponent(form.components, (component) => {
              if (component.properties && component.properties.displayFrom) {
                totalSubmission[ component.key ] =
                  item.data[ component.properties.displayFrom ];
              }
            });
          });
      }

      if (otherformData) {
        otherformData
          .filter((item) => item.data && item.data.shift)
          .map((item) => {
            eachComponent(form.components, (component) => {
              if (component.properties && component.properties.formPick) {
                totalSubmission[ component.key ] =
                  item.data[ component.properties.formPick ];
              }
            });
          });
      }

      if (isFilter && stateSubmission.data) {
        totalSubmission = getTotalInEditMode(
          form,
          stateSubmission,
          submissions,
          currentPage
        );
      }

      mergedSubmission = {
        ...stateSubmission,
        ...submissionFromServer,
        data: {
          ...submissionFromServer.data,
          ...stateSubmission.data,
          ...totalSubmission,
        },
      };
      // Check for default component value override
      eachComponent(form.components, (component) => {
        if (
          component.defaultValue === submission.data[ component.key ] &&
          submission.changed &&
          component.defaultValue !== submission.changed.value
        ) {
          mergedSubmission.data[ component.key ] =
            submissionFromServer.data[ component.key ];
        }
      });

      // Check for empty value manual override
      if (
        submission.changed &&
        (submission.changed.value === '' ||
          submission.changed.value === undefined ||
          submission.changed.value === null)
      ) {
        mergedSubmission.data[ submission.changed.component.key ] =
          submission.changed.value;
      }
    }

   return mergedSubmission;
  }
  setFormMessage(informAboutDraft) {
    const { draftSubmission, confirmSubmit } = this.state;
    const formMessage = {
      text: '',
      type: '',
    };
    if (
      this.state.fieldUpdated &&
      informAboutDraft &&
      !(
        this.state.formMessage.text &&
        this.state.formMessage.text.includes('required.')
      )
    ) {
      formMessage.text = UserMessages.DRAFT_SUBMISSION_PRESENT;
      formMessage.type = 'warning';
    } else if (!draftSubmission.isDraftSubmission) {
      formMessage.text = `The draft will not be saved. Record for selected ${ draftSubmission.invalidData.join(
        ', '
      ) } already exists.`;
      formMessage.type = 'warning';
    } else if (confirmSubmit) {
      formMessage.text = UserMessages.DATA_SAVED;
      formMessage.type = 'info';
    }

    if (formMessage.text && !isEqual(formMessage, this.state.formMessage)) {
      this.setState({ formMessage });

    }
  }

  onSubmitHandler = () => {
    const {
      onSubmit,
      filters,
      auth: { user },
      form: { form },
      submissions: { submissions },
      submission: { submission: propsSubmission },
      location,
    } = this.props;
    const { submission } = this.state;
    const date = moment(filters.date).format('YYYY-MM-DD[T]HH:mm:ss[.000Z]');
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    let submissionObject={};
    if(form && form.type=== 'resource'){
      submissionObject = {
        ...submission,
        data: {
          ...submission.data,
        
        },
        state: 'submitted',
      };
    }
    else{
     submissionObject = {
      ...propsSubmission,
      ...submission,
      data: {
        ...submission.data,
        line: filters.line,
        plant: `${ filters.plant }`,
        shift: filters.shift,
        date,
        gpid: user.data.gpid,
      },
      state: 'submitted',
    };
  }
    if (submissionObject.metadata === undefined) {
      submissionObject.metadata = {
        viewPage: currentPage,
      };
    }
    // Check for record to have required fields filled
    const invalidValues = this.getInvalidInSubmissionValues(submissionObject);

    if (invalidValues.length !== 0) {
      const formMessage = {
        text: '',
        type: '',
      };
      if (invalidValues.length === 1) {
        formMessage.text = `Field '${ invalidValues.join(', ') }' is required.`;
      } else {
        formMessage.text = `Fields ${ invalidValues.join(', ') } are required.`;
      }
      formMessage.type = 'danger';

      if (!isEqual(formMessage, this.state.formMessage)) {
        window.scrollTo(0, 0);
        this.setState({ formMessage });
      }

      return;
    }
    if (
      this.isUniqueInWizardFormSubmissions() ||
      this.isUniqueInFormSubmissions()
    ) {
      const invalidValuesUniqueInSubmissions = this.getInvalidUniqueInSubmissionsValues(
        submissionObject
      );

      if (invalidValuesUniqueInSubmissions.length === 0) {
        // Prevent app from creating draft once user press submit
        this.webform.options.saveDraft = false;
        this.webform.draftEnabled = false;

        this.setState({ editingSubmittedRecord: true });
        onSubmit(submissionObject, form.components[ currentPage ], submissions);
        this.setState({ confirmSubmit: true });
      } else {
        this.setState({
          formMessage: {
            text: `Record for selected ${ invalidValuesUniqueInSubmissions.join(
              ', '
            ) } already exists.`,
            type: 'danger',
          },
        });
      }
    } else {
      // Prevent app from creating draft once user press submit
      this.webform.options.saveDraft = false;
      this.webform.draftEnabled = false;

      this.setState({ editingSubmittedRecord: true });
      onSubmit(submissionObject, form.components[ currentPage ], submissions);
      this.setState(
        { confirmSubmit: true },
        () => {
          this.setFormMessage(); //added for submit message
        },
        window.scrollTo(0, 0)
      );
    }
  };

  render() {
    const {
      hideComponents,
      onSubmit,
      options,
      errors,
      match: {
        params: { formId },
      },
      location,
      languageParams: { language },
      form: { form, isActive: isFormActive },
      submission: { isActive: isSubActive, url, submission },
      auth,
      submissions: { submissions },
      otherformData,
    } = this.props;
    const { currentTab, tabsLength, formMessage, isLoaded } = this.state;
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    const buttonSettings = {
      showPrevious: false,
      showNext: false,
      showSubmit: false,
      showCancel: false,
    };

    /** API - dataFlow==='shiftToHourTab'
     * This is for forms which need data submitted at a shift level tab to be populated to each hourly tab added/edited
     */
    if(form && form.type==='resource'){

      eachComponent(
       form.components,
        (component) => {
          if (component.properties && component.properties.disableComponent === 'true') {
            component.disabled = true;
          }  
                        
        },
        true
      );
    }
    let shiftToHrTab = false;
    if (
      this.webform &&
      this.webform.component.properties &&
      this.webform.component.properties.dataFlow === 'shiftToHourTab'
    ) {
      shiftToHrTab = true;
    }

    let isFilter = false;
    if (
      this.webform &&
      this.webform.component.properties &&
      this.webform.component.properties.filterSubmission
    ) {
      isFilter = true;
    }

    const formDataToDisplay =
      (shiftToHrTab && submissions) ||
      ((otherformData || isFilter) && submission && submission.data)
        ? this.getFormDataToDisplay(
            otherformData,
            shiftToHrTab,
            currentPage,
            isFilter
          )
        : submission;

    if (
      (otherformData || shiftToHrTab || isFilter) &&
      this.webform &&
      formDataToDisplay !== undefined &&
      !isLoaded
    ) {
      this.setState((prevState) => {
        return {
          isLoaded: true,
          submission: {
            ...prevState.submission,
            data: {
              ...prevState.submission.data,
              ...formDataToDisplay.data,
            },
          },
        };
      });
    }

    const primaryButtonText =
      currentTab !== tabsLength - 1
        ? PageTexts.SAVE
        : auth.is.approver
        ? 'Verified'
        : PageTexts.SUBMIT_FOR_APPROVAL;
    const primaryButtonAction =
      currentTab !== tabsLength - 1
        ? this.onSubmitHandler
        : auth.is.approver
        ? () => console.log('verified')
        : () => this.onSubmitForApprovalHandler;

    if (isFormActive || isSubActive) {
      return (
          <div className="pep-c-loader">
              <div className="pep-c-iload" />
          </div>
      );
    }

    this.setFormMessage();

    return (
        <div>
            <Errors errors={ errors } />

            {formMessage.text && (
            <Message type={ formMessage.type } text={ formMessage.text } />
        )}
            <div className={ 'pep-edit' }>
                <Form
            form={ form }
            submission={ formDataToDisplay }
            url={ url }
            hideComponents={ hideComponents }
            onChange={ this.onChangeHandler }
            onSubmit={ onSubmit }
            onComponentChange={ this.onComponentChangeHandler }
            options={ {
              ...{
                templates: {
                  wizardHeader: {
                    form: ' ',
                  },
                  wizardNav: {
                    form: ' ',
                  },
                },
                template: 'bootstrap',
                iconset: 'fa',
                saveDraft: false,
                saveDraftThrottle: 10000,
                skipDraftRestore: true,
                buttonSettings,
                language: `${ language }`,
              },
              ...options,
            } }
            ref={ (instance) => {
              if (instance && !this.webform) {
                instance.createPromise.then(() => {
                  this.webform = instance.formio;

                  if (this.webform._form.display === 'wizard') {
                    this.webform.setPage(currentPage);
                  }
                  this.webform.restoreDraft(auth.user._id);
                });
              }
            } }
          />

                <BottomControlButtons
            secondaryButtonText={ i18next.t(PageTexts.BACK) }
            primaryButtonText={ i18next.t(primaryButtonText) }
            secondaryButtonPath={ (parseInt(currentPage) === 0) ?routeService.getPagePath.submission(
              language,
              formId
            ):routeService.getPagePath.submissionPage(
              language,
              formId,
              currentPage
            )  }
            primaryButtonPath={ routeService.getPagePath.submission(
              language,
              formId
            ) }
            isDeletion={ form.type !=='resource' }
            primaryButtonAction={ primaryButtonAction }
            isDeletionButtonPath={ routeService.getPagePath.deleteSubmission(
              language,
              formId,
              submission._id,
              currentPage
            ) }
          />
                {form.properties && form.properties.information && (
                <ImportantInstructions text={ form.properties.information } />
          )}
            </div>
        </div>
    );
  }
};

const mapStateToProps = (state) => {
  return {
    form: selectRoot('form', state),
    submission: selectRoot('submission', state),
    auth: selectRoot('auth', state),
    submissions: selectRoot('submissions', state),
    options: {
      noAlerts: false,
    },
    errors: [ selectError('submission', state), selectError('form', state) ],
    languageParams: selectRoot('languageParams', state),
    filters: selectRoot('filters', state),
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { location } = ownProps;
  const currentPage = routeService.getCurrentPageNumberFromLocation(location);
  const language = routeService.getLanguageFromHash(window.location.hash);
  return {
    onSubmit: (submission, form, submissions) => {
      submission.metadata = {
        viewPage: currentPage,
        recordType: 'hourLevelEdited',
        isOnline:navigator.onLine,
      };
     
      dispatch(
        saveSubmission(
          'submission',
          submission,
          ownProps.match.params.formId,
          (err, submission) => {
            if (!err) {
              dispatch(resetSubmissions('submission'));
              /**  // KPI Reporting requirements [LN] Code starts*/
              let shiftSubmission;
              if (form && form.properties && form.properties.kpiReport) {
                shiftSubmission = reportCalculations(
                  form,
                  currentPage,
                  submissions,
                  submission,
                  'edit'
                );
              }
              if (shiftSubmission !== undefined) {
                dispatch(
                  saveSubmission(
                    'submission',
                    shiftSubmission,
                    ownProps.match.params.formId,
                    (err) => {
                      if (!err) {
                        dispatch(resetSubmissions('submission'));
                      }
                    }
                  )
                );
              }
              /*/ KPI Reporting requirements [LN] Code ends */
              if( parseInt(currentPage) !== 0)
               {
                 dispatch(
                   push(
                     routeService.getPagePath.submissionPage(
                       language,
                       ownProps.match.params.formId,
                       currentPage
                     )
                   )
                 );
               
               }
               else{
                dispatch(
                  push(
                    routeService.getPagePath.submission(
                      language,
                      ownProps.match.params.formId
                    )
                  )
                );
               }             
            }
          }
        )
      );
    },
  };
};
Edit.propTypes = {
  auth: PropTypes.object,
  location: PropTypes.object,
  filters: PropTypes.object,
  match: PropTypes.object,
  otherformData: PropTypes.object,
  hideComponents: PropTypes.object,
  errors: PropTypes.any,
  options: PropTypes.object,
  languageParams: PropTypes.object,
  submission: PropTypes.object,
  submissions: PropTypes.object,
  onSubmit: PropTypes.func,
  form: PropTypes.object,
};

export default connect(mapStateToProps, mapDispatchToProps)(Edit);
