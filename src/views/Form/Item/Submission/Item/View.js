import React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { selectRoot, selectError, Errors } from 'react-formio';
import Form from '../../../../../containers/Form';
import Loading from '../../../../../containers/Loading';
import BottomControlButtons from '../../../../../containers/BottomControlButtons/BottomControlButtons';
import routeService from '../../../../../services/routeService';
import ImportantInstructions from '../../../../../containers/ImportantInstructions/ImportantInstructions';
import { PageTexts } from '../../../../../config';

const View = class extends Component {
  getButtonSettings = () => {
    return {
      showPrevious: false,
      showNext: false,
      showSubmit: false,
      showCancel: false,
    };
  };

  render() {
    const {
      hideComponents,
      onSubmit,
      options,
      errors,
      form: { form, isActive: isFormActive },
      submission: { submission, isActive: isSubActive, url },
      auth,
      location,
      match: {
        params: { formId },
      },
      languageParams: { language },
    } = this.props;
    const currentPage = routeService.getCurrentPageNumberFromLocation(location);
    const primaryButtonText = auth.is.approver
      ? 'Verified'
      : PageTexts.SUBMIT_FOR_APPROVAL;

    if (isFormActive || isSubActive) {
      return <Loading />;
    }

    return (
        <div>
            <h3>View {form.title} Submission</h3>
            <Errors errors={ errors } />
            <Form
          form={ form }
          submission={ submission }
          url={ url }
          hideComponents={ hideComponents }
          onSubmit={ onSubmit }
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
              template: 'bootstrap3',
              buttonSettings: this.getButtonSettings(),
              iconset: 'fa',
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
              });
            }
          } }
        />
            <BottomControlButtons
          secondaryButtonText={ PageTexts.BACK }
          primaryButtonText={ primaryButtonText }
          secondaryButtonPath={ routeService.getPagePath.submission(
            language,
            formId
          ) }
          isPrimaryButtonDisabled={ true }
        />
            {form.properties && form.properties.information && (
            <ImportantInstructions text={ form.properties.information } />
        )}
        </div>
    );
  }
};
View.propTypes = {
  auth: PropTypes.object,
  location: PropTypes.object,
  match:PropTypes.object,
  otherformData: PropTypes.object,
  hideComponents: PropTypes.object,
  errors:PropTypes.any,
  options: PropTypes.object,
  languageParams: PropTypes.object,
  submission: PropTypes.object,
  onSubmit: PropTypes.func,
  form:PropTypes.object,

};

const mapStateToProps = (state) => {
  return {
    form: selectRoot('form', state),
    auth: selectRoot('auth', state),
    submission: selectRoot('submission', state),
    languageParams: selectRoot('languageParams', state),
    options: {
      readOnly: true,
    },
    errors: [ selectError('submission', state), selectError('form', state) ],
  };
};

export default connect(mapStateToProps)(View);
