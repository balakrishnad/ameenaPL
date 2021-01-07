/* eslint no-undef: 0 */
import React from 'react';
import { connect } from 'react-redux';
import Confirm from '../../../../../containers/Confirm';
import {
  deleteSubmission,
  resetSubmissions,
  selectError,
  Errors,
} from 'react-formio';
import PropTypes from 'prop-types';
import { i18next } from '../../../../../i18n';
import { push, goBack } from 'connected-react-router';
import routeService from '../../../../../services/routeService';
import { UserMessages,Forms } from '../../../../../config';

const Reject = (props) => (
    <div>
        <Errors errors={ props.errors } />
        <Confirm { ...props } />
    </div>
);
Reject.propTypes = {
 errors: PropTypes.any

};

const mapStateToProps = (state) => {
  return {
    message: i18next.t(UserMessages.REJECT_FORM_CONFIRM, {
      id: state.submission.submission._id,
    }),
    errors: [ selectError('submission', state), selectError('form', state) ],
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const language = routeService.getLanguageFromHash(window.location.hash);
 
  return {
  
    onYes: () => {
      dispatch(
        deleteSubmission(
          'submission',
          ownProps.match.params.submissionId,
          ownProps.match.params.formId,
         
         
          (err) => {
            if (!err) {
              dispatch(resetSubmissions('submissions'));
              dispatch(
                push(
                  routeService.getPagePath.approver(language,Forms.Signature.id)                
                )
              );
            }
          }
        )
      );
    },
    onNo: () => {
      dispatch(goBack());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Reject);
