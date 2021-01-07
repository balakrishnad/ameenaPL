/* eslint no-undef: 0 */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { saveForm, selectError, FormEdit, Errors } from 'react-formio';
import { push } from 'connected-react-router';
import routeService from '../../services/routeService';

const Create = (props) => {
  return (
      <div>
          <h2>Create Form</h2>
          <hr />
          <Errors errors={ props.errors } />
          <FormEdit { ...props } />
      </div>
  );
};
Create.propTypes = {
  errors: PropTypes.any
 
 };
const mapStateToProps = (state) => {
  return {
    form: { display: 'form' },
    filters: selectRoot('filters', state),
    saveText: 'Create Form',
    errors: selectError('form', state),
    options: {
      builder: {
        resource: false,
      },
    },
  };
};

const mapDispatchToProps = (dispatch) => {
  const language = routeService.getLanguageFromHash(window.location.hash);

  return {
    saveForm: (form) => {
      const newForm = {
        ...form,
        tags: [ 'common' ],
      };
      dispatch(
        saveForm('form', newForm, (err, form) => {
          if (!err) {
            dispatch(push(routeService.getPagePath.form(language, form._id)));
          }
        })
      );
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Create);
