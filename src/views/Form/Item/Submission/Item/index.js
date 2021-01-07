import { Route, Switch } from 'react-router-dom';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import View from './View';
import Edit from './Edit';
import Delete from './Delete';
import Reject from './Reject';
import { selectRoot, getSubmission } from 'react-formio';
import routeService from '../../../../../services/routeService';

const Item = class extends Component {
  constructor() {
    super();

    this.state = {
      submissionId: '',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.match.params.submissionId !== prevState.submissionId) {
      nextProps.getSubmission(nextProps.match.params.submissionId);
    }

    return {
      submissionId: nextProps.match.params.submissionId,
    };
  }

  render() {
    const {
      isBlocked,
      languageParams: { language },
      otherformData,
    } = this.props;

    return (
        <div>
            <Switch>
                <Route
            exact
            path={ routeService.getPagePath.submissionDetails(
              language,
              ':formId',
              ':submissionId'
            ) }
            component={ View }
          />

                <Route
            path={ routeService.getPagePath.deleteSubmissionCommon(
              language,
              ':formId',
              ':submissionId'
            ) }
            component={ Delete }
          />
           <Route
            path={ routeService.getPagePath.rejectSubmissionCommon(
              language,
              ':formId',
              ':submissionId',
             
            ) }
            component={ Reject }
          />
                {isBlocked ? (
                    <Route
              path={ routeService.getPagePath.editSubmissionCommon(
                language,
                ':formId',
                ':submissionId'
              ) }
              component={ View }
            />
          ) : (
              <Route
              path={ routeService.getPagePath.editSubmissionCommon(
                language,
                ':formId',
                ':submissionId'
              ) }
              render={ (props) => (
                  <Edit { ...props } otherformData={ otherformData } />
              ) }
            />
          )}
            </Switch>
        </div>
    );
  }
};
Item.propTypes = {
  auth: PropTypes.object,
  match:PropTypes.object,
  otherformData: PropTypes.object,
  languageParams: PropTypes.object,
  getSubmission:PropTypes.func,
  isBlocked: PropTypes.bool

};

const mapStateToProps = (state) => {
  return {
    languageParams: selectRoot('languageParams', state),
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    getSubmission: (id) =>
      dispatch(getSubmission('submission', id, ownProps.match.params.formId)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Item);
