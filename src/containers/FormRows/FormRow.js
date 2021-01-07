import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { selectRoot } from 'react-formio';
import { i18next } from '../../i18n';
import { connect } from 'react-redux';
import routeService from '../../services/routeService';
import {
  resetApproverFlow,
} from '../../views/Form/Actions';
const FormRow = class extends Component {
  static propTypes = {
    forms: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
  };

  getBlockColor = (formStatus) => {
    const { isApprover } = this.props;
    if (!isApprover) {
      return 'form-row_block__new';
    }
    return 'form-row_block__new';
    // switch (formStatus) {
    //   case 'new':
    //     return 'form-row_block__new';
    //   case 'user-approved':
    //     return 'form-row_block__user-approved';
    //   case 'approved':
    //     return 'form-row_block__approved';
    //   case 'in-progress':
    //     return 'form-row_block__in-progress';
    //   default:
    //     return 'form-row_block__new';
    // }
  };

  compileFormBlocks = (forms) => {
    const {
      signatures: { submissions: signatures },
      submissions: { submissions },
      languageParams: { language },
    } = this.props;

    return forms.map((form, index) => {
      let signatureStatus = {};
      if (signatures) {
        signatureStatus = signatures.find(
          (signature) => signature.data.formId === form._id
        );
      }
      let formStatus = 'new';
      let tabs = [];
      if (form.display === 'wizard') {
        tabs = form.components.map((page, index) => {
          return {
            title: page.title,
            key: page.key,
            index: index,
            properties: page.properties,
          };
        });
      }

      formStatus = submissions.some(
        (signature) => signature.data.formId === form._id
      )
        ? 'in-progress'
        : formStatus;
      if (signatureStatus && signatureStatus._id) {
        if (signatureStatus.data.approverSignature) {
          formStatus = 'approved';
        } else if (signatureStatus.data.userSignature) {
          formStatus = 'user-approved';
        }
      }
      const showErroBanner =
        this.props.filters.line !== '' &&
        this.props.filters.plant !== '' &&
        this.props.filters.date !== '' &&
        this.props.filters.shift !== '';
      return (
        /* key should not have index so added unique value as Math.random() */
          <div className="col-md-2 pep-grid" key={ `row_${ Math.random() }` }>
              {!showErroBanner ? (
                  <div
              className={ `cursor-disable form-row_block ${ this.getBlockColor(
                formStatus
              ) }` }
            >
                      <div className="form-ref">{i18next.t(form.formReference)} </div>
                      <div className="form-dec">
                          {i18next.t(form.formNameDescription)}
                      </div>
                  </div>
          ) : (
              <Link
              to={
                form.display === 'wizard' &&
                tabs[ 0 ].properties &&
                tabs[ 0 ].properties.display === 'commonForShift'
                  ? routeService.getPagePath.formPage(language, form._id, 0)
                  : routeService.getPagePath.submission(language, form._id)
              }
              key={ `form_${ Math.random() }` }
            >
                  <div
                className={ `form-row_block ${ this.getBlockColor(formStatus) }` }
              >
                      <div className="form-ref">{i18next.t(form.formReference)} </div>
                      <div className="form-dec">
                          {i18next.t(form.formNameDescription)}
                      </div>
                  </div>
              </Link>
          )}
          </div>
      );
    });
  };

  render() {
    const { forms, title ,approverFlowCheck} = this.props;
    const formBlocks = this.compileFormBlocks(forms);
    if(approverFlowCheck && approverFlowCheck.approverView){
  
     this.props.resetApprover();
    }
    return (
        <>
            <hr />
            <h4>{i18next.t(title)}</h4>
            <div className="row">{formBlocks}</div>
        </>
    );
  }
};
FormRow.propTypes = {
  filters: PropTypes.object,
  submissions: PropTypes.object,
  languageParams: PropTypes.object,
  isApprover: PropTypes.bool,
  signatures: PropTypes.object,
  key: PropTypes.string,
  approverFlowCheck: PropTypes.object,
  resetApprover:PropTypes.func
};
const mapStateToProps = (state) => {
  return {
    languageParams: selectRoot('languageParams', state),
    signatures: selectRoot('signatures', state),
    submissions: selectRoot('submissions', state),
    filters: selectRoot('filters', state),
    approverFlowCheck:selectRoot('approverFlowCheck', state),
  };
};
const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    resetApprover: () => dispatch(resetApproverFlow()),
   
  };
};
export default connect(mapStateToProps,mapDispatchToProps)(FormRow);
