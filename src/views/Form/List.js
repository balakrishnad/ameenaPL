/* eslint no-undef: 0 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { push } from 'connected-react-router';
import {
  indexForms,
  selectRoot,
  selectError,
  Errors,
  getSubmissions,
  getForm,
} from 'react-formio';

import FormRows from '../../containers/FormRows/FormRows';
import Legend from '../../containers/Legend';
import { getQueryObject } from '../../utils';
import routeService from '../../services/routeService';
import { getUserForms } from './Actions/UserForms';
import { Forms } from '../../config';

const List = class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      legendItems: [
        {
          title: 'New',
          color: '#45a7c8',
        },
        {
          title: 'In-Progress',
          color: '#963694',
        },
        {
          title: 'User Approved',
          color: '#e6af2e',
        },
        {
          title: 'Approved',
          color: '#56bd66',
        },
      ],
      filters: {
        date: '',
        line: '',
        plant: '',
        shift: '',
      },
    };
  }

  static propTypes = {
    auth: PropTypes.object,
    filters: PropTypes.object,
    getSignaturesData: PropTypes.func,
    getSubmissions: PropTypes.func,
    getUserForms: PropTypes.func,
    getForms: PropTypes.func,
    errors:PropTypes.any,
    userForms: PropTypes.shape({
      forms: PropTypes.array,
      isLoading: PropTypes.bool,
      error: PropTypes.any,
      categories: PropTypes.array
    }),
    getSignatureForm: PropTypes.func
  };

  static defaultProps = {
    userForms: {
      forms: [],
      isLoading: false,
      error: null,
    },
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const { filters, getSignaturesData, getSubmissions } = nextProps;

    if (
      filters.date !== prevState.filters.date ||
      filters.shift !== prevState.filters.shift ||
      filters.line !== prevState.filters.line ||
      filters.plant !== prevState.filters.plant
    ) {
      const query = getQueryObject(filters, { limit: 999999 });

      getSignaturesData(1, query);
      getSubmissions(1, query);
    }

    return {
      filters: {
        ...nextProps.filters,
      },
    };
  }

  componentDidMount() {
    this.props.getSignatureForm();
    const gpid= this.props.auth.user.data.gpid? this.props.auth.user.data.gpid: 
      this.props.auth.user.data.nameID!== undefined ? parseInt(this.props.auth.user.data.nameID) : '';
    this.props.getUserForms(
      gpid,
      this.props.auth.user.data.email,
      this.props.auth.user,
      1,
      {
        limit: 999999,
        type: 'form',
        sort: 'created',
      }
    );
  }

  getRows = () => {
    const { userForms } = this.props;
    const categ=userForms.categories.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
    const rows = categ.map((category) => ({
      key: category.toLowerCase(),
      sort: false,
      title: category,
    }));

    return rows;
  };

  render() {
    const { getForms, errors, auth, userForms } = this.props;
    const language = routeService.getLanguageFromHash(window.location.hash);
    if (userForms.isLoading) {
      return (
          <div className="form-c">
              <div className="head"></div>
              <div className="rt-third">
                  <div className="rtn rt-6"></div>
                  <div className="rtn rt-6"></div>
                  <div className="rtn rt-6"></div>
                  <div className="rtn rt-6"></div>
              </div>
              <div className="clearfix"></div>
              <div className="head"></div>
              <div className="rt-third">
                  <div className="rtn rt-6"></div>
                  <div className="rtn rt-6"></div>
              </div>
              <div className="clearfix"></div>
          </div>
      );
    }

    const showErroBanner =
      this.props.filters.line !== '' &&
      this.props.filters.plant !== '' &&
      this.props.filters.date !== '' &&
      this.props.filters.shift !== '';

    return (
        <div>
            <Errors errors={ errors } />
            {!showErroBanner ? (
                <div className="pep-alert">
                    <div className="message-container message-container_warning pep-alertdiv">
                        Please select Plant, Line, Date and Shift
                    </div>
                </div>
        ) : null}
            <FormRows
          forms={ userForms }
          getForms={ getForms }
         // isApprover={ auth.is.approver }
         isApprover={ userForms && userForms.approverForms && userForms.approverForms.length !==0 }
          rows={ this.getRows() }
          language={language}
        />
            <div className="grid-footer">
                {auth.is.approver && <Legend items={ this.state.legendItems } />}
            </div>
        </div>
    );
  }
};

const mapStateToProps = (state) => {
  return {
    filters: selectRoot('filters', state),
    errors: selectError('forms', state),
    auth: selectRoot('auth', state),
    userForms: selectRoot('userForms', state),
  };
};

const mapDispatchToProps = (dispatch) => {
  const language = routeService.getLanguageFromHash(window.location.hash);

  return {
    getUserForms: (gpid, email, user, page, query = {}) =>
      dispatch(getUserForms(gpid, email, user, page, query)),
    getForms: (page, query = {}) => dispatch(indexForms('forms', page, query)),
    getSubmissions: (page, query) => {
      dispatch(getSubmissions('submissions', page, query, Forms.Report.id));
    },
    getSignatureForm: () => dispatch(getForm('form', Forms.Signature.id)),
    getSignaturesData: (page, query) =>
      dispatch(getSubmissions('signatures', page, query, Forms.Signature.id)),
    onAction: (form, action) => {
      switch (action) {
        case 'view':
          dispatch(push(routeService.getPagePath.form(language, form._id)));
          break;
        case 'submission':
          dispatch(
            push(routeService.getPagePath.submission(language, form._id))
          );
          break;
        case 'edit':
          dispatch(push(routeService.getPagePath.edit(language, form._id)));
          break;
        case 'delete':
          dispatch(push(routeService.getPagePath.delete(language, form._id)));
          break;
        default:
      }
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(List);
