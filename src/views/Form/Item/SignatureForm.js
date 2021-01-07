/* eslint no-useless-computed-key: 0 */
/* eslint no-undef: 0 */
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
} from 'react-formio';
import { i18next } from '../../../i18n';
import Form from '../../../containers/Form';
import LogMessage from '../../../containers/LogFile';
import PropTypes from 'prop-types';
import { push } from 'connected-react-router';
import BottomControlButtons from '../../../containers/BottomControlButtons/BottomControlButtons';
import routeService from '../../../services/routeService';
//import moment from 'moment-timezone';
import Message from '../../../containers/Message';
import { UserMessages, Forms, PageTexts, AppConfig, OfflinePluginConfig } from '../../../config';
import { createDateRange , signatureOffline } from '../../../utils';
// import FormioOfflineProject from 'formio-plugin-offline';

// const offlinePlugin = FormioOfflineProject.getInstance(
//   AppConfig.projectUrl,
//   AppConfig.projectUrl,
//   OfflinePluginConfig
// );

const View = class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: 0,
      tabsLength: 0,
      stateSubmission: {
        submission: {},
      },
      isSignature: false,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { signature } = nextProps;

    if (
      signature.submission.data &&
      signature.submission._id !== prevState.stateSubmission.submission._id &&
      signature.submission.data.userSignature
    ) {
      return {
        ...prevState,
        stateSubmission: signature,
      };
    }

    return prevState;
  }

  onChangeHandler = (change) => {
    const { filters } = this.props;

    if (
      !this.state.isSignature &&
      change.data &&
      !!change.data.userSignature &&
      change.changed &&
      !change.changed.flags.fromSubmission
    ) {
      this.setState({ isSignature: true });
    }

    if (this.state.isSignature && change.changed && !change.changed.value) {
      this.setState({ isSignature: false });
    }

    if (change.changed && change.state !== 'submitted') {
      this.setState((prevState) => {
        if (!change.data.userSignature && !change.data.approverSignature) {
          return prevState;
        }

        return {
          stateSubmission: {
            ...prevState.stateSubmission,
            submission: {
              ...prevState.stateSubmission.submission,
              data: {
                ...change.data,
                ...filters,
                plant: `${ filters.plant }`,
              },
            },
          },
        };
      });
    }
  };

  onSubmitHandler = () => {
    const {
      form: { form },
      onSubmit,
      filters,
      signatures: { submissions: signatures },
      auth: { user },
    } = this.props;
    const {
      stateSubmission: { submission },
    } = this.state;
   // const date = moment(filters.date).format('YYYY-MM-DD[T]HH:mm:ss');
    let date=filters.date.split('T')[ 0 ];
    date+='T00:00:00';
    const submissionObject = {
      data: {
        ...submission.data,
        formId: form._id,
        line: filters.line,
        plant: `${ filters.plant }`,
        shift: filters.shift,
        date: date,
      },
      state: 'submitted',
    };
    if (signatures.length!==0) {

      let signature = signatures
      .filter((signature) => signature.data.formId === form._id && 
      signature.data.formStatus === 'Pending approval'&& 
      signature.data.shift === filters.shift &&
      signature.data.line === filters.line &&
        parseInt(signature.data.plant) ===
          filters.plant &&
          signature.data.date.includes(
          filters.date.split('T')[ 0 ]))
      .map((signature) => {
        return signature;
      });
      if(signature.length !==0){
        submissionObject._id=signature[0]._id;
        submissionObject.data.formStatus = signature[0].data.formStatus;
        submissionObject.data.gpid = signature[0].data.gpid;
      }
      
    }
    // Check if there is signature in offline queue and show it while offline
    // if (offlinePlugin.offline && offlinePlugin.submissionQueue.length && (submissionObject.data.formStatus === '' ||
    // submissionObject.data.formStatus === undefined)) {
    //   const offlineSignature = offlinePlugin.submissionQueue.find(
    //     (offlineSubmission) => offlineSubmission.request.data.data.formId === form._id &&
    //     (offlineSubmission.request.form === Forms.Signature.id || offlineSubmission.request.data.data.userSignature || offlineSubmission.request.data.data.userSignature === '') &&
    //       offlineSubmission.request.data.data.line === filters.line &&
    //       parseInt(offlineSubmission.request.data.data.plant) === filters.plant &&
    //       offlineSubmission.request.data.data.shift === filters.shift &&
    //       (offlineSubmission.request.data.data.date).includes((filters.date).split('T')[ 0 ])
    //    );

    //   if (offlineSignature && offlineSignature.request.data.data.userSignature ) {
        
    //     submissionObject._id = offlineSignature.request._id;
    //     submissionObject.data.formStatus = offlineSignature.request.data.formStatus;
    //     submissionObject.data.gpid = offlineSignature.request.data.gpid;
    //   }
    // }
   
    submissionObject.data.formName=form.title;
    
    submissionObject.data.gpid=submissionObject.data.formStatus === undefined? user.data.gpid:submissionObject.data.gpid;
  
    submissionObject.data.formStatus !== undefined && submissionObject.data.formStatus === 'Pending approval'?
    submissionObject.data.formStatus="Approved":submissionObject.data.formStatus="Pending approval";

    onSubmit(submissionObject);
    this.setState({ isSignature: false });
  };

  
  componentWillUnmount() {
    delete this.webform;
  }

  render() {
    const {
      onSubmit,
      errors,
      form: { form, isActive },
      languageParams: { language },
      match: {
        params: { formId },
      },
      submissions,
      signature,
      filters,
      location,
      approverFlowCheck,
    } = this.props;
    
    
   
    const {
      stateSubmission: { submission },
      isSignature,
    } = this.state;
    let isSignatureFromSubmission =
      (signature.submission.data &&
        (!!signature.submission.data.formStatus &&
          signature.submission.data.formStatus !== '')) ||
      false;

    // if (offlinePlugin.submissionQueue.length) {
    //   isSignatureFromSubmission = signatureOffline( form._id,filters );     
    // }
   

    if(approverFlowCheck && approverFlowCheck.approverView && isSignatureFromSubmission){
      isSignatureFromSubmission =
      !!signature.submission.data &&
      (!!signature.submission.data.formStatus &&
        signature.submission.data.formStatus === 'Approved');
    } 
    /*Added shift level check to show draft error for signature only if any records of that shift have drafts-Applicable for Day level forms-Starts [LN] */
    const isSignatureAllowed = !submissions.submissions.some(
      (submission) =>
        submission.state === 'draft' && submission.data.shift === filters.shift
    );
    /*Added shift level check to show draft error for signature only if any records of that shift have drafts-Applicable for Day level forms-Ends [LN] */
    const isReadOnly = !isSignatureAllowed || isSignatureFromSubmission;
    const options = { ...this.props.options, readOnly: isReadOnly };
    let shiftSubmissions = {};
    if (submissions.submissions.length !== '0') {
      shiftSubmissions = submissions.submissions
        .filter((item) => item.data && item.data.shift === filters.shift)
        .map((item) => {
          return item;
        });
    }
    const isEmptySection = shiftSubmissions.length === 0;
    const primaryButtonText = (approverFlowCheck && approverFlowCheck.approverView)
      ? PageTexts.APPROVE_SHIFT
      : PageTexts.SUBMIT_AND_END_SHIFT;
    const primaryButtonAction = this.onSubmitHandler;
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    if (isActive || signature.isActive) {
      return (
          <div className="pep-c-loader">
              <div className="pep-c-iload"></div>
          </div>
      );
    }

    const submissionObject = {};
    if (signature.submission.data) {
      submissionObject.submission = submission;
    }

    // Check if there is signature in offline queue and show it while offline
    // if (offlinePlugin.offline && offlinePlugin.submissionQueue.length) {
    //    // const offlineSignature = signatureOffline( formId,filters );
    //    const offlineSignature = offlinePlugin.submissionQueue.find(
    //     (signatureOff) => signatureOff.request.data.data.formId === formId
    //    );

    //   if (offlineSignature && offlineSignature.request.data.data.userSignature) {
    //     submissionObject.submission = offlineSignature.request.data;
    //   }
    // }

    return (
        <div className="pep-sig-container">
            {/* {isEmptySection
          ? <Message type ={'info'} text={UserMessages.RECORDS_NOT_ADDED}/>
          : null} */}
 

            {isSignatureFromSubmission ?((signature.submission.data &&
        (!!signature.submission.data.formStatus &&
          signature.submission.data.formStatus === 'Pending approval')) ?(
                <Message type={ 'info' } text={UserMessages.SHIFT_PENDING_APPROVAL} />
        ) :(
                <Message type={ 'info' } text={ UserMessages.SHIFT_APPROVED } />
        ))
        
        : isSignatureAllowed ? (
          isEmptySection ? (
              <Message type={ 'info' } text={ UserMessages.RECORDS_NOT_ADDED } />
          ) :!(approverFlowCheck && approverFlowCheck.approverView)? (
              <Message
                type={ 'info' }
                text={ UserMessages.SHIFT_INSTRUCTIONS_TEXT }
              />
          ): (
            <Message
              type={ 'info' }
              text={ UserMessages.SHIFT_APPROVE_INSTRUCTIONS_TEXT }
            />
        )
        ) : (
            <Message
              type={ 'danger' }
              text={ UserMessages.SHIFT_DRAFT_RECORD_ALERT }
            />
        )}
            <div className="pep-signature">
                <div className="fld-name">
                    {i18next.t('Signature', { title: i18next.t(form.title) })}
                </div>
                <Errors errors={ errors } />
                <div className="pep-sig-form">
                    <Form
                      src={ Forms.Signature.url }
                      options={ {
                        ...{
                          template: 'bootstrap',
                          iconset: 'fa',
                          language: `${ language }`,
                        },
                        ...options,
                      } }
                      onChange={ this.onChangeHandler }
                      onSubmit={ onSubmit }
                      ref={ (instance) => {
                        if (instance) {
                          instance.createPromise.then(() => {
                            this.webform = instance.formio;
                            const properties = { ...this.webform._form.properties };

                            
                          //  Hide approver submission field if regular user or no user signature present
                            this.webform._form.properties.isHidden =!( approverFlowCheck && approverFlowCheck.approverView);
                        
                           if(this.webform && this.webform.component && this.webform.component.components ){
                            this.webform.component.components[3].disabled=( approverFlowCheck && approverFlowCheck.approverView);
                           }
                        
                            if (typeof properties.isHidden === 'undefined') {
                              this.webform.rebuild();
                            }
                          });
                        }
                      } }
                      { ...submissionObject }
                    />
                </div>
                {!isSignatureAllowed ||
                isSignatureFromSubmission ||
                !isSignature ||
                true}
                <BottomControlButtons
                  secondaryButtonText={ i18next.t(PageTexts.BACK) }
                  primaryButtonText={ primaryButtonText }
                  secondaryButtonPath={
                    form.components[ 0 ].properties &&
                    form.components[ 0 ].properties.display === 'commonForShift'
                      ? routeService.getPagePath.formPage(language, formId, 0)
                      : routeService.getPagePath.submission(language, formId)
                  }
                
                  isReject={ approverFlowCheck && approverFlowCheck.approverView && !isSignatureFromSubmission}	
                  
                  
                  primaryButtonAction={ primaryButtonAction }	
                  isRejectButtonPath={ routeService.getPagePath.deleteSubmission(	
                    language,	
                    Forms.Signature.id,	
                    signature.submission._id,	
                    currentPage,	
                    "reject"	
                   	
                  ) }
                  
                  isPrimaryButtonDisabled={

                    !isSignatureAllowed || isSignatureFromSubmission

                  }
                  isSectionEmpty={ isEmptySection }
                  fromSignatureForm={ true }
                />
            </div>
        </div>
    );
  }
};

const mapStateToProps = (state) => {
  
  return {
    submissions: selectRoot('submissions', state),
    form: selectRoot('form', state),
    auth: selectRoot('auth', state),
    errors: [ selectError('form', state), selectError('submission', state) ],
    filters: selectRoot('filters', state),
    languageParams: selectRoot('languageParams', state),
    signature: selectRoot('signature', state),
    signatures : selectRoot('signatures', state),
    userRoles:selectRoot('userRoles', state),
    approverFlowCheck :selectRoot('approverFlowCheck', state),
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const language = routeService.getLanguageFromHash(window.location.hash);
  return {
    onSubmit: (submission) => {
      dispatch(
        saveSubmission('submission', submission, Forms.Signature.id, (err) => {
          if (!err) {
            const range = createDateRange(submission.data.date);

            dispatch(
              getSubmissions(
                'signatures',
                1,
                {
                  [ 'data.date__gte' ]: range.from,
                  [ 'data.date__lte' ]: range.to,
                  [ 'data.line' ]: submission.data.line,
                  [ 'data.plant' ]: submission.data.plant,
                  [ 'data.shift' ]: submission.data.shift,
                  [ 'data.formId' ]: submission.data.formId,
                },
                Forms.Signature.id
              )
            );

            dispatch(resetSubmissions('submission'));
            LogMessage.info(submission, 'SignatureForm.js- SaveSubmission');

            dispatch(
              push(
                routeService.getPagePath.signature(
                  language,
                  ownProps.match.params.formId
                )
              )
            );
          }
        })
      );
    },
  };
};
View.propTypes = {
  auth: PropTypes.object,
  location: PropTypes.object,
  filters:PropTypes.object,
  match:PropTypes.object,
  otherformData: PropTypes.object,
  hideComponents: PropTypes.object,
  errors:PropTypes.any,
  options: PropTypes.object,
  languageParams: PropTypes.object,
  submission: PropTypes.object,
  submissions: PropTypes.object,
  onSubmit: PropTypes.func,
  form:PropTypes.object,
  signature: PropTypes.object

};

export default connect(mapStateToProps, mapDispatchToProps)(View);
