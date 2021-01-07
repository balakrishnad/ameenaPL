/* eslint no-undef: 0 */
import React from 'react';
import { connect } from 'react-redux';
import Confirm from '../../../../../containers/Confirm';
import {
  deleteSubmission,
  resetSubmissions,
  selectError,
  Errors,
  saveSubmission,
} from 'react-formio';

import { reportCalculations } from '../../helper';
import PropTypes from 'prop-types';
import { i18next } from '../../../../../i18n';
import { push, goBack } from 'connected-react-router';
import routeService from '../../../../../services/routeService';
import { UserMessages } from '../../../../../config';
import  store  from '../../../../../store';

const Delete = (props) => (
    <div>
        <Errors errors={ props.errors } />
        <Confirm { ...props } />
    </div>
);
Delete.propTypes = {
 errors: PropTypes.any

};

const mapStateToProps = (state) => {
  return {
    message: i18next.t(UserMessages.DELETE_MESSAGE_CONFIRM, {
      id: state.submission.submission._id,
    }),
    errors: [ selectError('submission', state), selectError('form', state) ],
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { location } = ownProps;
  const currentPage = routeService.getCurrentPageNumberFromLocation(location);
  const language = routeService.getLanguageFromHash(window.location.hash);
  const form =store.getState().form;
  const submissions =store.getState().submissions.submissions;
  const submission=store.getState().submission.submission;
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
                  'delete'
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
          }
        )
      );
    },
    onNo: () => {
      dispatch(goBack());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Delete);
