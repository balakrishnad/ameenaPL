/* eslint no-useless-computed-key: 0 */
/* eslint array-callback-return: 0 */
/* eslint no-undef: 0 */
/* eslint no-unused-vars:0 */
import React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux';
import {
  selectRoot,
  resetSubmissions,
  saveSubmission,
  selectError,
  Errors,
  getSubmissions,
  clearFormError,
  clearSubmissionError,
} from 'react-formio';
import PropTypes from 'prop-types';
import { eachComponent } from 'formiojs/utils/formUtils';
import { push } from 'connected-react-router';
import moment from 'moment-timezone';
import { isEqual, isEmpty } from 'lodash';
import { formLevelValidations, setShiftLevelRecord, reportCalculations ,getShiftLevelRecords} from './helper';
import { signatureOffline ,getSubmissionDefaultQuery} from '../../../utils';
import { i18next } from '../../../i18n';
import Form from '../../../containers/Form';
import LogMessage from '../../../containers/LogFile';
import Loading from '../../../containers/Loading';
import BottomControlButtons from '../../../containers/BottomControlButtons/BottomControlButtons';
import ImportantInstructions from '../../../containers/ImportantInstructions/ImportantInstructions';
import routeService from '../../../services/routeService';
import {
  Forms,
  UserMessages,
  PageTexts,
  AppConfig,
  OfflinePluginConfig,
} from '../../../config';
import Message from '../../../containers/Message';
// import FormioOfflineProject from 'formio-plugin-offline';
import {
  finishSubmissionsDequeuing,
  startSubmissionsDequeuing,
} from '../Actions';

// const offlinePlugin = FormioOfflineProject.getInstance(
//   AppConfig.projectUrl,
//   AppConfig.projectUrl,
//   OfflinePluginConfig
// );

// const isOfflineSubmissions = (formId, filters) => offlinePlugin.submissionQueue.some(
//   (offlineSubmission) => {
//     return (
//       ( offlineSubmission.request.data !== null &&
//         offlineSubmission.request.form === formId &&
//         offlineSubmission.request.data.data.line === filters.line &&
//         parseInt(offlineSubmission.request.data.data.plant) ===
//         filters.plant &&
//         offlineSubmission.request.data.data.date.includes(
//           filters.date.split('T')[ 0 ]
//         )) ||
//       // Check if offline signature belongs this form
//       (offlineSubmission.request.form === Forms.Signature.id &&
//         offlineSubmission.request.data.data.formId === formId)
//     );
//   }
// );

const View = class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      submission: {},
      secondaryButtonPath: '',
      isTotalLoaded: false,
      serverSubmissionLoaded: false,
      draftSubmission: { isDraftSubmission: true, invalidData: [] },
      currentPage: 0,
      confirmSubmit: false,
      firstChange: true,
      formMessage: {
        text: '',
        type: '',
      },
      isButtonLoading: false,
      fieldUpdated: false,
      isFinishedDequeuing: false,
    };
  }

  componentDidMount() {
    const { resetFormErrors } = this.props;

    // if (!offlinePlugin.submissionQueueLength()) {
    //   this.setState({isFinishedDequeuing: true});
    // }


    resetFormErrors();

    window.addEventListener('online', this.onlineListener);
  
  }

  componentWillUnmount() {
    delete this.webform;

    window.removeEventListener('online', this.onlineListener);
  }

  onlineListener = () => {
    const {
      location,
      match: {
        params: { formId },
      },
      filters,
    } = this.props;

    let preventPageReload = true;
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    if (
      this.webform &&
      this.webform.component.properties &&
      this.webform.component.properties.display === 'commonForShift'
    ) {
      preventPageReload = false;
    }

    // If commonForShift page then run dequeueOfflineSubmissions
    // const isOfflineSubmissionsForForm = isOfflineSubmissions(formId, filters);
    // const isAbleToProcessQueue =
    //   offlinePlugin.submissionQueueLength() &&
    //   !offlinePlugin.dequeuing &&
    //   isOfflineSubmissionsForForm;

    // if (isAbleToProcessQueue) {
    //   this.dequeueOfflineSubmissions(formId, preventPageReload);
    // }
  };

  // dequeueOfflineSubmissions = (formId, preventPageReload = true) => {
  //   this.props.startSubmissionDequeuing();

  //   offlinePlugin
  //     .dequeueSubmissions(true, 0, true, (req) => {
  //       return (
  //         (req.data && req.type === 'submission') ||
  //         (req.data && req.data.data) ||
  //         req.method === 'DELETE'
  //       );
  //     })
  //     .finally(() => {
  //       this.props.finishSubmissionDequeuing();
  //       this.setState({ isFinishedDequeuing: true });
  //       if (!preventPageReload) {
  //         window.location.reload();
  //       } else {
  //         this.props.goToFormPreview();
  //       }
  //     });
  // };

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
    if (!change._id && this.state.submission._id) {
      change._id = this.state.submission._id;
      if (this.webform) {
        this.webform.submission._id = this.state.submission._id
      }
    }

    // Update submission of webform instance to save it for draft
    if (this.webform !== undefined) {
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

    if (this.state.firstChange && !change.changed) {
      this.setState((prevState) => {
        return {
          submission: {
            ...change,
            data: {
              ...change.data,
              ...filters,
              plant: `${ filters.plant }`,
            },
          },
          firstChange: false,
        };
      });
    }

    if (change.changed) {
      let draftSubmission = this.state.draftSubmission;

      if (this.webform && !change._id && !this.state.isButtonLoading && change.changed.value) {
       this.formLoadWait();
      } else if (this.state.isButtonLoading) {
         // Reset button after data change (No hourly level forms)
        this.setState({ isButtonLoading: false });
       
      }

      if (change._id && !this.state.submission._id) {
        if (this.webform) {
          // Prevent draft when state submission doesn't have id and set it form change
          this.webform.options.saveDraft = false;
          this.webform.draftEnabled = false;
          this.webform.savingDraft = true;
        }
      }

      if (
        this.isUniqueInWizardFormSubmissions() ||
        this.isUniqueInFormSubmissions()
      ) {
        const invalidValues = this.getInvalidUniqueInSubmissionsValues(change);

        if (invalidValues.length === 0) {
          if (
            (
              !this.webform.savingDraft ||
              this.state.draftSubmission.invalidData.length > 0
            ) && !(!this.state.submission._id && !change.changed.value)
          ) {
            this.webform.draftEnabled = true;
            this.webform.savingDraft = false;

            this.webform.saveDraft();
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
          /*/ Added check to prevent draft for RBS-03  [LN] reportLevel !== 'dayLevel'
          For now commenting out autosave  for all shift level records till formio platform fix */
        if (this.webform !== undefined && !this.webform.options.saveDraft) {
          this.webform.options.saveDraft = true;
          this.webform.draftEnabled = true;
          this.webform.savingDraft = false;
          if (
            !this.webform.component.properties ||
            (
              this.webform.component.properties &&
              this.webform.component.properties.display !== 'commonForShift'
            )
          ) {
            this.webform.saveDraft();
         }
        }
      }

      const changeData = { ...change.data };
      const stateData = { ...this.state.submission.data };
      delete stateData.date;
      delete changeData.date;
      changeData.approvalStatus=stateData.approvalStatus;
      changeData.fromDate=stateData.fromDate;
      changeData.toDate=stateData.toDate;
      changeData.submitter=stateData.submitter;
      changeData.formName=stateData.formName;
      changeData.formShift=stateData.formShift;
      

      if (
        !isEqual(changeData, stateData) &&
        change.changed.value !== stateData[ change.changed.component.key ]
      ) {
        let state = !this.state.submission.state
          ? ''
          : this.state.submission.state === 'submitted'
          ? 'submitted'
          : 'draft';
        if (
          (change.changed.value || change.changed.value === '') &&
          !change.changed.component.hidden &&
          !change.changed.component.calculateValue &&
          change.changed.component.properties &&
          change.changed.component.properties.totalFor === undefined
        ) {
          state = 'draft';
        }

        if (
          change.data[change.changed.component.key ] === '' ||
          change.data[change.changed.component.key ] === undefined ||
          change.data[change.changed.component.key ] === null ||
          change.data[change.changed.component.key ] === 0
        ) {
          if (change.data[change.changed.component.key ] === 0) {
            change.data[change.changed.component.key ] = 0;
          } else {
            change.data[change.changed.component.key ] = '';
          }
        }

        this.setState((prevState) => {
          return {
            isTotalLoaded: false,
            submission: {
              ...prevState.submission,
              ...change,
              state,
              data: {
                ...prevState.submission.data,
                ...change.data,
              },
            },
            fieldUpdated: true,
            confirmSubmit: false,
          };
        });
      //  window.scrollTo(0, 0);
      }

      let viewOnlyTab = false;
      if (
        this.webform &&
        this.webform.component.properties &&
        this.webform.component.properties.viewOnly === 'true'
      ) {
        viewOnlyTab = true;
      }
      let informAboutDraft = false;
      //Check to prevent draft error message if no changes actually happenined in the tab
      //Check added to disable draft message in case default date is set in the component
      const pageComponents = [];
      const formComponents = ["gpid","date","line","plant","shift"];
      const formComp=form.components[parseInt(currentPage)];
      eachComponent(formComp.components, (component) => {
        pageComponents.push(component.key);
      });
      if (this.state.submission._id && !viewOnlyTab && change.changed && !isEqual(changeData, stateData) &&
        change.changed.value && change.changed.value !== null && change.changed.value !== '' &&
        change.changed.component.calculateValue === ''
        && pageComponents.includes(change.changed.component.key) && !formComponents.includes(change.changed.component.key)
        ){
        informAboutDraft = true;
      }

      this.setFormMessage(informAboutDraft);
      // To show total based on the filter value (i.e PC-12)
      if (
        change.changed &&
        change.changed.value &&
        change.changed.component &&
        change.changed.component.properties &&
        change.changed.component.properties.filterSubmissionRequired
      ) {
        this.setState({ isTotalLoaded: false });
      }
    }
  };

  onComponentChangeHandler = () => {
    const {
      match: {
        params: { formId },
      },
      languageParams: { language },
      location,
      approverFlowCheck
    } = this.props;
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);

    if (this.webform !== undefined && this.state.currentPage !== currentPage) {
      this.getBackButtonPath(language, formId, currentPage,approverFlowCheck);
    }
  };

  formLoadWait = () => {
   this.setState({
      isButtonLoading: true,
    });

    this.interval = setTimeout(() => {
      this.setState({
        isButtonLoading: false,
      });
    }, 2000); //this will enable button after 2 seconds you can change time here.
  };

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

  getRequiredFields() {
    let requiredKeysString = [];

    if (this.webform !== undefined) {
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

  getInvalidUniqueInSubmissionsValues(newSubmission) {
    const {
      submissions: { submissions },
    } = this.props;
    const uniqueValues = this.getUniqueInSubmissionsKeys();

    return uniqueValues.filter((uniqueValue) =>
      submissions.some((sub) => {
        const isValuesEqual =
          sub.data[ uniqueValue ] === newSubmission.data[ uniqueValue ];

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

 onSaveDraftBegin = () => this.setState({ isButtonLoading: true });
  onSaveDraft = (submission = {}) => {
    if (!submission._id) {
       return this.setState({ isButtonLoading: false });
    }

    if (!this.state.submission || !this.state.submission._id) {
      return this.setState({
        submission: {
          ...this.state.submission,
          _id: submission._id,
        },
        isButtonLoading: false,
      });
    }
  
   this.setState({ isButtonLoading: false });
 
  };

  onSubmitHandler = () => {
    const {
      onSubmit,
      filters,
      location,
      auth: { user },
      form: { form },
    } = this.props;
    const { submission } = this.state;

    const date = moment(filters.date).format('YYYY-MM-DD[T]HH:mm:ss[.000Z]');
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    let preventRedirectAfterSubmission = false;

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
          ...submission,
          data: {
            ...submission.data,
            line: filters.line,
            plant: `${ filters.plant }`,
            shift: filters.shift,
            date: date,
            gpid: user.data.gpid,
          },
          state: 'submitted',
        };
    }

    let returningPage = currentPage;
    if (
      this.webform &&
      this.webform.component.properties &&
      this.webform.component.properties.display === 'commonForShift'
    ) {
      returningPage = 0;
      preventRedirectAfterSubmission = parseInt(currentPage) === 0;
    }

    // Avoid duplicate records on immediate submit after draft
    if (this.webform !== undefined) {
        if (this.webform.submission._id && (this.webform.submission._id !== this.state.submission._id)) {
        this.setState((prevState) => {
          return {
            submission: {
              ...prevState.submission,
              _id: this.webform.submission._id,
            },
          };
        });
        submissionObject._id = this.webform.submission._id;
      }
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

    // Check for record to be unique for selected time slot
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
        this.webform.savingDraft = true;
        this.webform.triggerSaveDraft.cancel();

        onSubmit(
          submissionObject,
          returningPage,
          preventRedirectAfterSubmission
        );
      
        this.setState({ confirmSubmit: true, isButtonLoading: true });
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
      this.webform.savingDraft = true;
      this.webform.triggerSaveDraft.cancel();

      onSubmit(submissionObject, returningPage, preventRedirectAfterSubmission);
      this.setState(
        { confirmSubmit: true, isButtonLoading: true },
        () => {
          this.setFormMessage(); //added for submit message
          this.formLoadWait();
        },
        window.scrollTo(0, 0)
      );
    }
  };

  onSubmitForApprovalHandler = () => {
    const { goToSignaturePage } = this.props;

    goToSignaturePage();
  };

  getBackButtonPath = (language, formId, currentPage,approverFlowCheck) => {
    let path = '';

    if (
      this.webform &&
      this.webform.component &&
      this.webform.component.properties &&
      this.webform.component.properties.display &&
      (this.webform.component.properties.display === 'commonForShift' ||
        this.webform.component.components[ Number.parseFloat(currentPage) ]
          .properties.display === 'commonForShift')
    ) {
      path = routeService.getPagePath.submission(language, formId);
      /* Check to navigate to submission page rather than preview in case first page is a common for shift page -starts [LN]*/
      if (
        this.webform && this.webform.components && this.webform.components[0] && this.webform.components[ 0 ].component.properties &&
        this.webform.components[ 0 ].component.properties.display ===
          'commonForShift'
      ) {
        path = routeService.getPagePath.formPage(language, formId, 0);
      
      }
      /* Check to navigate to submission page rather than preview in case first page is a common for shift page -ends [LN]*/

      if (parseInt(currentPage) === 0) {
        path = routeService.getPagePath.formsList(language);
        if(approverFlowCheck && approverFlowCheck.approverView){
          path = routeService.getPagePath.approver(language,Forms.Signature.id);
        } 
      }
     
     
    } else {
      path = routeService.getPagePath.submissionPage(
        language,
        formId,
        currentPage
      );
      if (parseInt(currentPage) === 0) {
        path = routeService.getPagePath.submission(language,
          formId,);
      
      }
     
    }

    this.setState({
      secondaryButtonPath: path,
      currentPage: currentPage,
    });
  };

  getButtonSettings = () => {
    return {
      showPrevious: false,
      showNext: false,
      showSubmit: false,
      showCancel: false,
    };
  };

  getSubmissionToDisplay() {
    const {
      location,
      submissions: { submissions },
      form: { form },
    } = this.props;
    const { submission, serverSubmissionLoaded } = this.state;
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    const shiftSel = this.props.filters.shift;

    let submissionToDisplay = null;

    if (
      this.webform &&
      this.webform.component.properties &&
      this.webform.component.properties.display === 'commonForShift'
    ) {
      /*For forms with day level calculations, remove other shift data for display purpose alone in hourly/shift level tabs
       Such form tabs should have api key  have "dispLevel" with value "shiftLevel"  */

      const submissionFromServer = submissions.find(
        (submission) =>
          submission.metadata &&
          submission.metadata.viewPage &&
          parseInt(submission.metadata.viewPage) === parseInt(currentPage) &&
          (this.webform.component.properties.dispLevel === undefined ||
            (this.webform.component.properties.dispLevel === 'shiftLevel' &&
              submission.data.shift === shiftSel))
      ) || { data: {} };
      let mergedSubmission;
      // Get data from `totalFor` components to display
      if (submission.data) {
        const totalSubmission = {};

        eachComponent(form.components, (component) => {
          if (component.properties && component.properties.totalFor) {
            totalSubmission[ component.key ] = submission.data[ component.key ];
          }
        });

        mergedSubmission = {
          ...submission,
          ...(!serverSubmissionLoaded ? submissionFromServer : {}),
          data: {
            ...submission.data,
            ...(!serverSubmissionLoaded ? submissionFromServer.data : {}),
            ...totalSubmission,
          },
        };

        if (submissionFromServer._id && !serverSubmissionLoaded) {
          this.setState({ serverSubmissionLoaded: true });
        }

        Object.keys(submission.data).forEach((key) => {
          if (
            submission.data[ key ] &&
            typeof submission.data[ key ] !== 'object'
          ) {
            mergedSubmission.data[ key ] = submission.data[ key ];
          }
        });

        // Check for default component value override
        eachComponent(form.components, (component) => {
          if (
            component.defaultValue === submission.data[ component.key ] &&
            submission.changed &&
            component.key === submission.changed.component.key &&
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
            submission.changed.value === null ||
            submission.changed.value === 0)
        ) {
          mergedSubmission.data[ submission.changed.component.key ] = submission.changed.value;
        }
      }

      submissionToDisplay =
        submissions && submissions.length !== 0 ? mergedSubmission : null;

      if (submissionToDisplay && !isEqual(submissionToDisplay.data, submission.data)) {
        this.setState({
          submission: {
            ...submissionToDisplay,
            ...this.state.submission,
            data: {
              ...submissionToDisplay.data
            }
          }
        });
      }
    }
  }

  setFormMessage(informAboutDraft, shouldClear) {
    const { draftSubmission, confirmSubmit, submission } = this.state;
    const formMessage = {};

    if (
      informAboutDraft &&
      !(
        this.state.formMessage.text &&
        this.state.formMessage.text.includes('required.')
      )
    ) {
      formMessage.text = UserMessages.DRAFT_SUBMISSION_PRESENT;
      formMessage.type = 'warning';
    }
    if (!draftSubmission.isDraftSubmission) {
      formMessage.text = `The draft will not be saved. Record for selected ${ draftSubmission.invalidData.join(
        ', '
      ) } already exists.`;
      formMessage.type = 'warning';
    } else if (confirmSubmit) {
      formMessage.text = UserMessages.DATA_SAVED;
      formMessage.type = 'info';
    } else if (
      // Check if unique fields already changed
      draftSubmission.isDraftSubmission &&
      this.state.formMessage.text &&
      this.state.formMessage.text.includes('Record for selected')
    ) {
      formMessage.text = '';
      formMessage.type = '';
    }

    // Check if required fields already filled
    const invalidValues = this.getInvalidInSubmissionValues(submission);
    if (
      !invalidValues.length &&
      this.state.formMessage.text &&
      this.state.formMessage.text.includes('required.')
    ) {
      formMessage.text = '';
      formMessage.type = '';
    }

    if (shouldClear) {
      formMessage.text = '';
      formMessage.type = '';
    }

    if (
      formMessage.text !== undefined &&
      !isEqual(formMessage, this.state.formMessage)
    ) {
      this.setState({ formMessage });
    }
  }

  render() {
    const {
      hideComponents,
      onSubmit,
      errors,
      signature,
      location,
      match: {
        params: { formId },
      },
      languageParams: { language },
      form: { form, isActive, url },
      submissions: { submissions },
      otherformData,
      auth,
      filters,
      offlineQueue,
        userForms,
        approverFlowCheck,
    } = this.props;
    const {
      secondaryButtonPath,
      isTotalLoaded,
      isButtonLoading,
      formMessage,
      submission,
      isFinishedDequeuing,
    } = this.state;
    
    if(form && form.type==='resource'){

      eachComponent(
       form.components,
        (component) => {
          if (component.properties && component.properties.disableComponentAdd === 'true') {
            component.disabled = true;
          }  
          else if (component.properties && component.properties.disableComponent === 'true' && 
          component.properties.disableComponentAdd === undefined) {
            component.disabled = false;
          } 
          if (component.properties && component.properties.defaultComponent) {
            component.defaultValue = filters[component.properties.defaultComponent];
          }                   
        },
        true
      );
    }
   
    // const isOfflineSubmissionsForForm = isOfflineSubmissions(formId, filters);
    // const isAbleToProcessQueue =
    //   offlinePlugin.submissionQueueLength() &&
    //   !offlinePlugin.dequeuing &&
    //   isOfflineSubmissionsForForm;
    // const isReadyToDeque = navigator.onLine && !(isActive || offlineQueue.dequeuing);

    // if (isAbleToProcessQueue && isReadyToDeque && !isFinishedDequeuing) {
    //   this.dequeueOfflineSubmissions(formId, false);
    // }

    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    if(form && form.components && form.components[ currentPage ]){
      let shiftSubmissions = getShiftLevelRecords(form.components[ currentPage ],submissions,filters.shift);
       
      console.log("Shift Submissions---",shiftSubmissions);
    }
    if (
      this.webform &&
      this.webform._form.display === 'wizard' &&
      parseInt(this.webform.page) !== parseInt(currentPage)
    ) {
      this.setState({ isTotalLoaded: false });
      this.webform.setPage(currentPage);
      this.setFormMessage(false, true);
    }
   
    const primaryButtonText = 'Submit';
    let isShiftClosed =
      !!signature.submission.data &&
      (!!signature.submission.data.formStatus &&
        signature.submission.data.formStatus !== '');
    // Check if there is signature in offline queue and disable editing
    // if (offlinePlugin.submissionQueue.length) {
    //   console.log("offlinePlugin.submissionQueue---",offlinePlugin.submissionQueue);
    //   isShiftClosed = signatureOffline(form._id, this.props.filters);
    // }

    if(approverFlowCheck && approverFlowCheck.approverView && isShiftClosed && userForms && userForms.approverForms && userForms.approverForms.includes(form._id)){
      isShiftClosed =
      !!signature.submission.data &&
      (!!signature.submission.data.formStatus &&
        signature.submission.data.formStatus === 'Approved') && !userForms.superApprover;
    } 

    if(form && form.type === 'resource' && form._id ===Forms.Line.id){
      isShiftClosed = true;
    }
    const options = { ...this.props.options, readOnly: isShiftClosed };

    // let informAboutDraft = false;
    /* Check to disable submit button for tabs which are view only[Reports] -starts [LN]*/
    /* Tab API property to set as  viewOnly=true */
    let viewOnlyTab = false;
    if (
      this.webform &&
      this.webform.component.properties &&
      this.webform.component.properties.viewOnly === 'true'
    ) {
      viewOnlyTab = true;
    }
    /** API - dataFlow==='shiftToHourTab'
     * This is for forms which need data submitted at a shift level tab to be populated to each hourly tab added/edited
     */
    let shiftToHourFetch = false;
    if (
      this.webform &&
      this.webform.component.properties &&
      this.webform.component.properties.dataFlow === 'shiftToHourTab'
    ) {
      shiftToHourFetch = true;
    }

    /* Check to disable submit button for tabs which are view only[Reports] -ends [LN]*/
    const shiftSel = this.props.filters.shift;

    /* If filtersubmission property is there then we have to filter the submissions
      to get totalValue */
    let isFilter = false;
    if (
      this.webform &&
      this.webform.component.properties &&
      this.webform.component.properties.filterSubmission
    ) {
      isFilter = true;
    }

    const result = formLevelValidations(
      form,
      submissions,
      currentPage,
      isTotalLoaded,
      otherformData,
      shiftToHourFetch,
      isFilter,
      submission,
      shiftSel
    );

    /* Set total submission tot current form if any forms have total logic incurred
       Make sure that total field have custom property `totalFor`
       Where 'totalFor' value equals to corresponding field API key */
    // eslint-disable-next-line no-mixed-operators
    if (
      (this.webform !== undefined &&
        result !== undefined &&
        !isEmpty(result) &&
        !isTotalLoaded) ||
      (isFilter && !isTotalLoaded)
    ) {
      let totalSubmission = {};
      if (shiftToHourFetch || otherformData !== null) {
        totalSubmission = result;
      }
      eachComponent(form.components, (component) => {
        if (component.properties && component.properties.totalFor) {
          if (result == null) {
            totalSubmission[ component.key ] = 0;
          } else {
            const totalForProperties = component.properties.totalFor.split(',');
            let total = 0;

            if (totalForProperties.length > 0) {
              totalForProperties.filter((item) => {
                Object.keys(result).filter((key) => {
                  if (key === item) {
                    total += result[ item ];
                  }
                });
              });
            }

            totalSubmission[ component.key ] = total;
          }
        }
      });

      this.setState((prevState) => {
        return {
          isTotalLoaded: true,
          submission: {
            ...prevState.submission,
            data: {
              ...prevState.submission.data,
              ...totalSubmission,
            },
          },
        };
      });
    }

  //  if (isActive || isSubmissionActive || isSubmissionsActive || isUserFormsLoading) {
    if (isActive || offlineQueue.dequeuing) {
      return <Loading />;
    }

    if (submissions && submissions.length !== 0) {
      this.getSubmissionToDisplay();
    }

    const isPrimaryButtonDisabled = (primaryButtonText === 'Submit' && isShiftClosed) || viewOnlyTab
      || !this.state.submission || !this.state.submission._id;

    return (
        <div>
            <Errors errors={ errors } />

            {formMessage.text && (
            <Message type={ formMessage.type } text={ formMessage.text } />
        )}

            <div className={ 'pep-forms' }>
                <Form
                  form={ form }
                  url={ url }
                  options={ {
                    ...{
                      templates: {
                        wizardHeader: { form: ' ' },
                        wizardNav: { form: ' ' },
                      },
                      template: 'bootstrap',
                      iconset: 'fa',
                      saveDraft: false,
                      saveDraftThrottle: 10000,
                      skipDraftRestore: true,
                      buttonSettings: this.getButtonSettings(),
                      language: `${ language }`,
                    },
                    ...options,
                  } }
                  hideComponents={ hideComponents }
                  submission={ submission }
                  pageToSet={ isShiftClosed ? currentPage : null }
                  onChange={ this.onChangeHandler }
                  onSubmit={ onSubmit }
                  onComponentChange={ this.onComponentChangeHandler }
                  onSaveDraftBegin={ this.onSaveDraftBegin }
                  onSaveDraft={ this.onSaveDraft }
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
                //  secondaryButtonText={ i18next.t(PageTexts.BACK) }
                 secondaryButtonText={parseInt(currentPage) === 0 && approverFlowCheck && approverFlowCheck.approverView? i18next.t(PageTexts.BACK_TO_APPROVER) : i18next.t(PageTexts.BACK) }
                  primaryButtonText={ i18next.t(primaryButtonText) }
                  secondaryButtonPath={ secondaryButtonPath }
                  primaryButtonAction={ this.onSubmitHandler }
                  isPrimaryButtonLoading={ isButtonLoading }
                  isPrimaryButtonDisabled={ isPrimaryButtonDisabled }
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
    auth: selectRoot('auth', state),
    signature: selectRoot('signature', state),
    submissions: selectRoot('submissions', state),
    //submission: selectRoot('submission', state),
    userForms: selectRoot('userForms', state),
    errors: [ selectError('form', state), selectError('submission', state) ],
    options: {
      noAlerts: false,
    },
    languageParams: selectRoot('languageParams', state),
    filters: selectRoot('filters', state),
    offlineQueue: selectRoot('offlineQueue', state),
    approverFlowCheck:selectRoot('approverFlowCheck', state),
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { location, form } = ownProps;
  let {submissions} = ownProps;
  const currentPage = routeService.getCurrentPageNumberFromLocation(location);
  const language = routeService.getLanguageFromHash(window.location.hash);

  return {
    onSubmit: (submission, returningPage, preventRedirectAfterSubmission) => {
      submission.metadata = {
        viewPage: currentPage,
        recordType: 'hourLevelAdded',
        isOnline:navigator.onLine,
      };
      submission=setShiftLevelRecord(form,submissions,submission,currentPage);
    
      dispatch(
        saveSubmission(
          'submission',
          submission,
          ownProps.match.params.formId,
          (err) => {
            if (!err) {
              const reportSubmission = {
                state: 'submitted',
                data: {
                  date: submission.data.date,
                  shift: submission.data.shift,
                  line: submission.data.line,
                  plant: submission.data.plant,
                  formId: ownProps.match.params.formId,
                },
              };

              dispatch(
                saveSubmission('submission', reportSubmission, Forms.Report.id)
              );

              dispatch(resetSubmissions('submission'));
              /** // KPI Reporting requirements [LN] Code starts*/
              let shiftSubmission;
              if (
                form.form &&
                form.form.components[ currentPage ] &&
                form.form.components[ currentPage ].properties &&
                form.form.components[ currentPage ].properties.kpiReport
              ) {
                shiftSubmission = reportCalculations(
                  form.form.components[ currentPage ],
                  currentPage,
                  submissions,
                  submission,
                  'insert'
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
              if (preventRedirectAfterSubmission) {

                let defaultQuery=getSubmissionDefaultQuery(form.form, submission.data,null, ownProps.match.params.formId);
                dispatch(getSubmissions('submissions', 1, { ...defaultQuery },ownProps.match.params.formId) );                
                
              } else {

                if (
                 ( form && form.form && form.form.components && form.form.components[0] && form.form.components[ 0 ].properties &&
                  form.form.components[ 0 ].properties.display ===
                    'commonForShift') || parseInt(currentPage) !== 0
                ) {
                  dispatch(
                    push(
                      routeService.getPagePath.submissionPage(
                        language,
                        ownProps.match.params.formId,
                        returningPage
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
          }
        )
      );
    },
    resetFormErrors: () => {
      dispatch(clearFormError('form'));
      dispatch(clearSubmissionError('submission'));
    },
    goToFormPreview: () => {
      const language = routeService.getLanguageFromHash(window.location.hash);

      dispatch(
        push(
          routeService.getPagePath.submissionPage(
            language,
            ownProps.match.params.formId,
            0
          )
        )
      );
    },
    startSubmissionDequeuing: () => dispatch(startSubmissionsDequeuing()),
    finishSubmissionDequeuing: () => dispatch(finishSubmissionsDequeuing()),
  };
};
View.propTypes = {
  auth: PropTypes.object,
  signatures: PropTypes.object,
  location: PropTypes.object,
  match: PropTypes.object,
  filters: PropTypes.object,
  submissions: PropTypes.object,
  otherformData: PropTypes.object,
  hideComponents: PropTypes.object,
  signature: PropTypes.object,
  errors: PropTypes.any,
  approverForms:PropTypes.object,
  options: PropTypes.object,
  getSignaturesData: PropTypes.func,
  languageParams: PropTypes.object,
  getSubmissions: PropTypes.func,
  resetSubmission: PropTypes.func,
  getSubmission: PropTypes.func,
  submission: PropTypes.object,
  getForm: PropTypes.func,
  getUserForms: PropTypes.func,
  onSubmit: PropTypes.func,
  goToSignaturePage: PropTypes.func,
  startSubmissionDequeuing: PropTypes.func,
  finishSubmissionDequeuing: PropTypes.func,
  goToFormPreview: PropTypes.func,
  form: PropTypes.object,
  userForms: PropTypes.shape({
    forms: PropTypes.array,
    dataSetList: PropTypes.array,
  }),
  resetFormErrors: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(View);
