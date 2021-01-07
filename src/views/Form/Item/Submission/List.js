/* eslint no-useless-computed-key: 0 */
/* eslint no-undef: 0 */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import qs from 'qs';
import FormioUtils from 'formiojs/utils';
import PropTypes from 'prop-types';
import { getSubmissions, selectRoot, selectError, Errors } from 'react-formio';
import SubmissionGrid from '../../../../containers/SubmissionGrid';
// import FormioOfflineProject from 'formio-plugin-offline';
import { getComponentDefaultColumn, setColumnsWidth } from 'react-formio';
import { i18next } from '../../../../i18n';
import BottomControlButtons from '../../../../containers/BottomControlButtons/BottomControlButtons';
import Legend from '../../../../containers/Legend';
import routeService from '../../../../services/routeService';
import {
  getQueryObject,
  signatureOffline,
  getSubmissionDefaultQuery,
} from '../../../../utils';
import {
  AppConfig,
  Forms,
  PageTexts,
  OfflinePluginConfig,
} from '../../../../config';
import {
  startSubmissionsDequeuing,
  finishSubmissionsDequeuing,
  setApproverFlow,
  setFiltersValue,
} from '../../Actions';

import SummaryGrid from '../../../../containers/SummaryGrid';
// import LogMessage from '../../../../containers/LogFile';

/* This class handles the submissions for the preview screen for a hourly tabs
 */

// const offlinePlugin = FormioOfflineProject.getInstance(
//   AppConfig.projectUrl,
//   AppConfig.projectUrl,
//   OfflinePluginConfig
// );

// const isOfflineSubmissions = (formId, filters) => offlinePlugin.submissionQueue.some(
//   (offlineSubmission) => {
//     return(
//         offlineSubmission.request.form === formId &&
//         offlineSubmission.request.data !==null &&
//         offlineSubmission.request.data.data.line === filters.line &&
//         parseInt(offlineSubmission.request.data.data.plant) === filters.plant &&
//         offlineSubmission.request.data.data.shift === filters.shift &&
//         (offlineSubmission.request.data.data.date).includes((filters.date).split('T')[ 0 ])
//       ) ||
//       (
//         // Check if offline signature belongs this form
//         offlineSubmission.request.form === Forms.Signature.id &&  offlineSubmission.request.data!==null &&
//         offlineSubmission.request.data.data.formId === formId
//       ) ||
//       (
//         // Check if offline record is DELETE request
//         offlineSubmission.request.form === formId &&
//         offlineSubmission.request.method === 'DELETE'
//       );;
//   }
// );

const List = class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filters: {
        date: '',
        line: '',
        plant: '',
        shift: '',
      },
      legendItems: [
        {
          title: 'Partial',
          color: '#ffdccd',
        },
      ],
    };
  }

  componentDidMount() {
    const {
      match: {
        params: { formId },
      },
      filters,
    } = this.props;
    const query = getQueryObject(filters, { ['data.formId']: formId });
    this.props.getSignaturesData(1, query);

    // this.props.setOfflineSubmissionStorage(1, {limit: 999999});

    window.addEventListener('online', this.onlineListener);

  }

  componentWillUnmount() {
    window.removeEventListener('online', this.onlineListener);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (
      (nextProps.filters.date !== prevState.filters.date ||
        nextProps.filters.shift !== prevState.filters.shift ||
        nextProps.filters.line !== prevState.filters.line ||
        nextProps.filters.fromDate !== prevState.filters.fromDate ||
        nextProps.filters.toDate !== prevState.filters.toDate ||
        nextProps.filters.submitter !== prevState.filters.submitter ||
        nextProps.filters.formName !== prevState.filters.formName ||
        nextProps.filters.formShift !== prevState.filters.formShift ||
        nextProps.filters.approvalStatus !== prevState.filters.approvalStatus ||
        nextProps.filters.plant !== prevState.filters.plant) &&
      nextProps.form &&
      nextProps.form.properties &&
      nextProps.form.properties.formType
    ) {

      let defaultQuery = getSubmissionDefaultQuery(nextProps.form, nextProps.filters, nextProps.userForms, nextProps.form._id);
      nextProps.getSubmissions(1, { ...defaultQuery });

      return {
        ...prevState,
        filters: {
          ...nextProps.filters,
        },
      };
    }
  }

  dequeueOfflineSubmissions = (formId) => {
    const query = getQueryObject(this.props.filters, { limit: 999999 });
    this.props.getSubmissions(1, query);
    this.props.startSubmissionDequeuing();

    offlinePlugin
      .dequeueSubmissions(true, 0, true, (req) => {
        return (
          (req.data && req.type === 'submission') ||
          (req.data && req.data.data) ||
          req.method === 'DELETE'
        );
      })
      .finally(() => {
        const query = getQueryObject(this.props.filters, { limit: 999999 });
        this.props.getSubmissions(1, query);
        this.props.getSignaturesData(1, query);
        this.props.finishSubmissionDequeuing();
      });
  };

  componentDidUpdate() {
    const { auth } = this.props;

    this.operations = [
      {
        action: 'view',
        buttonType: 'primary',
        icon: 'pencil',
        permissionsResolver() {
          if (auth.is.administrator) {
            return false;
          }
          return false;
        },
        title: 'Enter Data',
      },
      {
        action: 'submission',
        buttonType: 'warning',
        icon: 'list-alt',
        permissionsResolver() {
          if (auth.is.administrator) {
            return false;
          }
          return false;
        },
        title: 'View Data',
      },
      {
        action: 'edit',
        buttonType: 'secondary',
        icon: 'edit',
        permissionsResolver() {
          if (auth.is.administrator || auth.is.formcreator) {
            return false;
          }
          return false;
        },
        title: 'Edit Form',
      },
      /* @TODO : Can be removed during cleanup, ad delete on a row is removed now */
      {
        action: 'delete',
        buttonType: 'light',
        icon: 'trash',
        permissionsResolver() {
          return true;
        },
      },
    ];
  }

  getColumns = (form) => {
    const { location } = this.props;
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    let columns = [];

    const components =
      form.display === 'wizard' &&
        qs.parse(location.search, { ignoreQueryPrefix: true }).page !== undefined
        ? form.components[currentPage].components
        : form.components;

    FormioUtils.eachComponent(components, (component) => {
      if (component.input && component.tableView && component.key) {
        columns.push(getComponentDefaultColumn(component));
      }
    });
    /** @TOdO  remove the limit here
     * See the css changes needed
     */
    columns.length = 6;
    if (form._id !== Forms.Signature.id) {
      columns.length = 5;
    }
    setColumnsWidth(columns);
    columns = columns.map((column, index) => {
      if (column.key === 'data.time') {
        column.width = 1;
      } else if (index === 1 || index === 0) {
        column.width = 3;
        if (form._id === Forms.Signature.id) {
          column.width = 2;
        }

      } else {
        column.width = 2;
      }
      return column;
    });

    return columns;
  };

  getCurrentPageSubmission(submissions) {
    const { location, filters, form } = this.props;
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    /*For forms with day level calculations, remove other shift data for display purpose alone in hourly tabs
    Such form tabs should have api key  have "dispLevel" with value "shiftLevel"  */

    const result = submissions.submissions.filter(
      (submission) =>
        submission.metadata &&
        parseInt(submission.metadata.viewPage) === parseInt(currentPage) &&
        (form.components[currentPage].properties === undefined ||
          (form.components[currentPage].properties &&
            form.components[currentPage].properties.dispLevel === undefined) ||
          (form.components[currentPage].properties &&
            form.components[currentPage].properties.dispLevel ===
            'shiftLevel' &&
            submission.data.shift === filters.shift))
    );


    return {
      ...submissions,
      submissions: result,
    };
  }

  onSubmitForApprovalHandler = () => {
    const { goToSignaturePage } = this.props;

    goToSignaturePage();
  };

  onlineListener = () => {
    const {
      match: {
        params: { formId },
      },
      filters,
    } = this.props;

    // const isOfflineSubmissionsForForm = isOfflineSubmissions(formId, filters);
    // const isAbleToProcessQueue =
    //   offlinePlugin.submissionQueueLength() &&
    //   !offlinePlugin.dequeuing &&
    //   isOfflineSubmissionsForForm;

    // // Dequeue Offline Submissions once app is back online
    // if (isAbleToProcessQueue) {
    //   this.dequeueOfflineSubmissions(formId);
    // }
  };

  getSubmissions = (page, query) => {
    const {
      form,
      userForms,
      filters
    } = this.props;

    let defaultQuery = getSubmissionDefaultQuery(form, filters, userForms, form._id);
    this.props.getSubmissions(page, { ...defaultQuery, ...query });

  };

  render() {
    const {
      form,
      isLoading,
      onAction,
      submissions,
      //  getSubmissions,
      errors,
      // auth,
      match: {
        params: { formId },
      },
      location,
      languageParams: { language },
      signatures: { submissions: signatures },
      filters,
      userForms,
      approverFlowCheck,
    } = this.props;

    // const isOfflineSubmissionsForForm = isOfflineSubmissions(formId, filters);

    if (formId === Forms.Signature.id && approverFlowCheck && !approverFlowCheck.approverView) {
      this.props.setApprover();
    }
    // const isAbleToProcessQueue =
    //   offlinePlugin.submissionQueueLength() &&
    //   !offlinePlugin.dequeuing &&
    //   isOfflineSubmissionsForForm;
    const isReadyToDeque = navigator.onLine && !isLoading;

    // if (isAbleToProcessQueue && isReadyToDeque) {
    //   this.dequeueOfflineSubmissions(formId);
    // }

    if (isLoading) {
      return (
        <div className="pep-c-loader">
          <div className="pep-c-iload"></div>
        </div>
      );
    }
    submissions.pagination = {};
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);

    let submissionsForGrid =
      form.display === 'wizard'
        ? this.getCurrentPageSubmission(submissions)
        : submissions;

    if (Forms.Signature.id === form._id && submissionsForGrid !== undefined && submissionsForGrid.submissions.length !== 0 && filters.submitter >= 1000) {
      let result = submissionsForGrid.submissions.filter(
        (submission) => (((submission.data.gpid).toString()).includes(filters.submitter.toString()))
      );
      submissionsForGrid.submissions = result;
    }
    //Check is signature is already done. If done , then restrict Add, Edit,Delete record features and disable the submit buttons
    let isBlocked = false;
    if (signatures) {
      isBlocked = signatures.some(
        (signature) =>
          signature.data.formId === form._id &&
          (signature.data.formStatus && signature.data.formStatus !== '')
      );
    }

    // if (offlinePlugin.submissionQueue.length) {
    //   isBlocked = signatureOffline(form._id, this.props.filters);
    // }

    if (approverFlowCheck && approverFlowCheck.approverView && isBlocked && userForms && userForms.approverForms && userForms.approverForms.includes(formId)) {
      isBlocked = false;
      if (!userForms.superApprover && signatures) {
        isBlocked = signatures.some(
          (signature) =>
            signature.data.formId === form._id &&
            (signature.data.formStatus && signature.data.formStatus === 'Approved')
        );
      }
    }
    if (form && form.type === 'resource' && form._id === Forms.Line.id) {
      isBlocked = true;
    }

    const nodata = submissionsForGrid.submissions.length === 0;
    const annualForm = form && form.properties && form.properties.AnnualForm === true;
    const isReportPage =
      form &&
      form.components &&
      form.components[currentPage] &&
      form.components[currentPage].properties &&
      form.components[currentPage].properties.summary;

    /**Filtering shiftlevel submissions for report view [LN] starts */
    let summarySubmissions = {};
    if (isReportPage && submissions.length !== '0') {
      summarySubmissions = submissions.submissions
        .filter((item) => item.metadata && parseInt(item.metadata.viewPage) !== 1)
        .map((item) => {
          return item;
        });
    } else {
      summarySubmissions = submissions.submissions;
    }
    /**Filtering shiftlevel submissions for report view [LN] Ends */
    return (
      <div className="form-index">
        <Errors errors={errors} />
        {!isReportPage ? (
          <div
            className={`pep-gridcon ${parseInt(currentPage) === 0 ? 'pep-noborder' : ''
              }`}
          >
            <SubmissionGrid
              submissions={submissionsForGrid}
              form={form}
              columns={this.getColumns(form)}
              onAction={(...args) => {
                onAction(...args, isBlocked);
              }}
              operations={this.operations}

              getSubmissions={this.getSubmissions}

            />
          </div>
        ) : (
            <div>
              <SummaryGrid submissions={summarySubmissions} form={form} />
            </div>
          )}

        <div className="grid-footer">
          <div className="pep-plusbtn">
            {isBlocked || isReportPage || form._id === Forms.Signature.id ? null : (
              <Link
                className="btn btn-primary btn-add-new"
                to={routeService.getPagePath.formPage(
                  language,
                  formId,
                  currentPage
                )}
              >
                <i
                  className="glyphicon glyphicon-plus fa fa-plus"
                  aria-hidden="true"
                />
                {i18next.t('', { title: i18next.t(form.title) })}
              </Link>
            )}
          </div>

          {!isReportPage && form._id !== Forms.Signature.id ? <Legend items={this.state.legendItems} /> : ''}
        </div>
        <BottomControlButtons
          secondaryButtonText={parseInt(currentPage) === 0 && approverFlowCheck && approverFlowCheck.approverView ? i18next.t(PageTexts.BACK_TO_APPROVER) : i18next.t(PageTexts.BACK)}
          primaryButtonText={
            form._id === Forms.Signature.id || (approverFlowCheck && approverFlowCheck.approverView)
              ? i18next.t(PageTexts.APPROVE_FORM)

              : i18next.t(PageTexts.SUBMIT_FOR_APPROVAL)
          }
          secondaryButtonPath={
            (parseInt(currentPage) === 0
              ? ((approverFlowCheck && approverFlowCheck.approverView) ? routeService.getPagePath.approver(language, Forms.Signature.id) :
                routeService.getPagePath.formsList(language))
              : ((form && form.components && form.components[0] && form.components[0].properties &&
                form.components[0].properties.display ===
                'commonForShift') ? routeService.getPagePath.formPage(language, formId, 0) :
                routeService.getPagePath.submission(language, formId)))
          }
          primaryButtonAction={this.onSubmitForApprovalHandler}
          isPrimaryButtonDisabled={isBlocked || (form._id === Forms.Signature.id) || annualForm ||
            form.type === 'resource'}

          currentPage={currentPage}
          nodata={nodata}
        />
      </div>
    );
  }
};

const mapStateToProps = (state) => {
  const form = selectRoot('form', state);
  const submissions = selectRoot('submissions', state);
  const auth = selectRoot('auth', state);
  const filters = selectRoot('filters', state);
  const languageParams = selectRoot('languageParams', state);
  const signatures = selectRoot('signatures', state);
  const offlineQueue = selectRoot('offlineQueue', state);
  const userForms = selectRoot('userForms', state);

  const approverFlowCheck = selectRoot('approverFlowCheck', state);

  return {
    form: form.form,
    submissions: submissions,
    isLoading: form.isActive || submissions.isActive || signatures.isActive || offlineQueue.dequeuing,
    auth,
    errors: [selectError('submissions', state), selectError('form', state)],
    filters,
    languageParams,
    signatures,
    userForms,
    approverFlowCheck,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { location } = ownProps;
  const currentPage = routeService.getCurrentPageNumberFromLocation(location);
  const language = routeService.getLanguageFromHash(window.location.hash);

  return {
    getSubmissions: (page, query) =>
      dispatch(
        getSubmissions('submissions', page, query, ownProps.match.params.formId)
      ),
    // setOfflineSubmissionStorage: (page, query) =>
    //   dispatch(
    //     getSubmissions('offlineSubmissions', page, query, ownProps.match.params.formId)
    //   ),
    getSignaturesData: (page, query) =>
      dispatch(getSubmissions('signatures', page, query, Forms.Signature.id)),
    onAction: (submission, action, isBlocked) => {
      if (submission.form === Forms.Signature.id) {

        if (ownProps.userForms && ownProps.userForms.forms && ownProps.userForms.forms.length !== 0) {
          const formDetails = ownProps.userForms.forms
            .filter((item) => item._id && item._id === submission.data.formId)
            .map((item) => {
              return item;
            });
          const filterValues =
            ownProps.headerFilterForm.data ||
            JSON.parse(window.sessionStorage.getItem('filters')) ||
            {};
          filterValues.line = submission.data.line;
          filterValues.shift = submission.data.shift;
          filterValues.date = submission.data.date;
          window.sessionStorage.setItem('filters', JSON.stringify(filterValues));
          dispatch(setFiltersValue(filterValues));
          if (formDetails.length !== 0 && formDetails[0].components[0] && formDetails[0].components[0].properties &&
            formDetails[0].components[0].properties.display && formDetails[0].components[0].properties.display === 'commonForShift') {

            dispatch(
              push(
                routeService.getPagePath.formPage(
                  language,
                  submission.data.formId, 0
                )
              )
            );
          }
          else {
            dispatch(
              push(
                routeService.getPagePath.submission(
                  language,
                  submission.data.formId
                )
              )
            );
          }
        }
        else {
          dispatch(
            push(
              routeService.getPagePath.approver(
                language,
                submission.data.formId
              )
            )
          );
        }

      }
      else {
        switch (action) {
          case 'view':
          case 'row':
            dispatch(
              push(
                isBlocked
                  ? routeService.getPagePath.submissionDetailsPage(
                    language,
                    ownProps.match.params.formId,
                    submission._id,
                    currentPage
                  )
                  : routeService.getPagePath.editSubmission(
                    language,
                    ownProps.match.params.formId,
                    submission._id,
                    currentPage
                  )
              )
            );
            break;
          case 'edit':
            dispatch(
              push(
                routeService.getPagePath.editSubmission(
                  language,
                  ownProps.match.params.formId,
                  submission._id,
                  currentPage
                )
              )
            );
            break;
          case 'delete':
            dispatch(
              push(
                routeService.getPagePath.deleteSubmission(
                  language,
                  ownProps.match.params.formId,
                  submission._id,
                  currentPage
                )
              )
            );
            break;
          default:
        }
      }

    },
    goToSignaturePage: () => {
      dispatch(
        push(
          routeService.getPagePath.signature(
            language,
            ownProps.match.params.formId
          )
        )
      );
    },
    setApprover: () => dispatch(setApproverFlow()),
    startSubmissionDequeuing: () => dispatch(startSubmissionsDequeuing()),
    finishSubmissionDequeuing: () => dispatch(finishSubmissionsDequeuing()),
  };
};

List.propTypes = {
  auth: PropTypes.object,
  errors: PropTypes.any,
  match: PropTypes.object,
  languageParams: PropTypes.object,
  otherformData: PropTypes.object,
  isBlocked: PropTypes.bool,
  signatures: PropTypes.object,
  location: PropTypes.object,
  filters: PropTypes.object,
  submissions: PropTypes.object,
  hideComponents: PropTypes.object,
  signature: PropTypes.object,
  options: PropTypes.object,
  getSignaturesData: PropTypes.func,
  getSubmissions: PropTypes.func,
  resetSubmission: PropTypes.func,
  getSubmission: PropTypes.func,
  submission: PropTypes.object,
  getForm: PropTypes.func,
  getUserForms: PropTypes.func,
  onSubmit: PropTypes.func,
  goToSignaturePage: PropTypes.func,
  form: PropTypes.object,
  isLoading: PropTypes.bool,
  startSubmissionDequeuing: PropTypes.func,
  finishSubmissionDequeuing: PropTypes.func,
  onAction: PropTypes.func,
  approverView: PropTypes.object,
  approverForms: PropTypes.object,
  userForms: PropTypes.object,
  approverFlowCheck: PropTypes.object,
  setApprover: PropTypes.func,
  isPrimaryButtonDisabled: PropTypes.bool,
};
export default connect(mapStateToProps, mapDispatchToProps)(List);
