import { Route, Switch } from 'react-router-dom';
import React from 'react';
import List from './List';
import Item from './Item/index';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { selectRoot } from 'react-formio';
import routeService from '../../../../services/routeService';

const Form = (props) => {
  const {
    languageParams: { language },
    otherformData,
    userForms,
    headerFilterForm,
  } = props;

  return (
      <div>
          <Switch>
              <Route
          exact
          path={ routeService.getPagePath.submission(language, ':formId') }
          render={ (props) => <List { ...props } isBlocked={ props.isBlocked } userForms={userForms} headerFilterForm={headerFilterForm}/> }
        />
              <Route
          path={ routeService.getPagePath.submissionDetails(
            language,
            ':formId',
            ':submissionId'
          ) }
          render={ (props) => (
              <Item
              { ...props }
              isBlocked={ props.isBlocked }
              otherformData={ otherformData }
            />
          ) }
        />
          </Switch>
      </div>
  );
};
Form.propTypes = {
  languageParams: PropTypes.object,
  otherformData: PropTypes.object,
  isBlocked: PropTypes.bool,
};
const mapStateToProps = (state) => {
  return {
    languageParams: selectRoot('languageParams', state),
    userForms:selectRoot('userForms',state),
    headerFilterForm: selectRoot('headerFilterForm', state),
  };
};

export default connect(mapStateToProps)(Form);
