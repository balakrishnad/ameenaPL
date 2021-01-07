/* eslint no-undef: 0 */
import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { selectRoot, getForm } from 'react-formio';
import { setFiltersValue } from './Actions';
import { getAccessByGpid } from './Actions/UserForms';
import { PropTypes } from 'prop-types';
//import { getDataSet } from './Actions/DataSet';
import ReactForm from '../../containers/Form';
import List from './List';
import Item from './Item/index';
import { Forms } from '../../config';
import routeService from '../../services/routeService';

class Form extends Component {
  state = {
    headerFilterForm: null,
    approverFilter:false,
  };

  setPlantDefaults(form, access, defaultPlantId) {
    const plantSelect = form.components[ 0 ].columns[ 0 ].components[ 0 ];

    if (plantSelect) {
      const lineIds = [];
      access.forEach(({ data }) => lineIds.push(...data.lineId));

      // TODO: Move this property to component schema after formiojs update
      const previousFilter = plantSelect.filter ? `${ plantSelect.filter }&` : '';
      plantSelect.filter = `${ previousFilter }data.productionLineId__in=${ lineIds.join(
        ','
      ) }`;
      plantSelect.uniqueOptions = true;
      if (defaultPlantId !== null && defaultPlantId !== undefined) {
        plantSelect.defaultValue = defaultPlantId.toString();
      }
    }
    
  }

  setLineDefaults(form, access, defaultLineId) {
    const lineSelect = form.components[ 0 ].columns[ 1 ].components[ 0 ];
    if (!lineSelect) {
      return;
    }

    const lineIds = [];
    access.forEach(({ data }) => lineIds.push(...data.lineId));
    lineSelect.filter = `${
      lineSelect.filter
    }&data.productionLineId__in=${ lineIds.join(',') }`;
    if (defaultLineId !== null && defaultLineId !== undefined) {
      lineSelect.defaultValue = defaultLineId;
    } else if (lineIds.length !== 0) {
      lineSelect.defaultValue = lineIds[ 0 ];
    }
  }
 
  componentDidMount() {
    const { auth, getUserAccess, getHeaderFilterForm } = this.props;
    //this.props.getDataSet();
   
    if (this.props.headerFilterForm && this.props.headerFilterForm.id) {
      return this.setState({
        headerFilterForm: this.props.headerFilterForm.form,
      });
    }

    getHeaderFilterForm((err, headerFilterForm) => {
      if (err) {
        return;
      }
      const gpid= auth.user.data.gpid? auth.user.data.gpid: 
      auth.user.data.nameID!== undefined ? parseInt(auth.user.data.nameID) : '';
      getUserAccess(
        gpid,
        auth.user.data.email,
        auth.user,
        (err, access) => {
          const filterValues =
            headerFilterForm.data ||
            JSON.parse(window.sessionStorage.getItem('filters')) ||
            {};
         
          if (err) {
            this.props.onFiltersChange(filterValues);
            return this.setState({ headerFilterForm ,
            });
          }
          const plantId = auth.user.data.plantId;
          const lineId = auth.user.data.productionLineId;
          this.setPlantDefaults(headerFilterForm, access, plantId);
          this.setLineDefaults(headerFilterForm, access, lineId);
          this.props.onFiltersChange(filterValues);
          this.setState({ headerFilterForm });
        }
      );
    });
  }
  static propTypes = {
    auth: PropTypes.object,
    headerFilterForm: PropTypes.object,
    languageParams: PropTypes.object,
    getUserAccess: PropTypes.func,
    getHeaderFilterForm: PropTypes.func,
    onFiltersChange: PropTypes.func,
    location: PropTypes.object,
  };
  render() {
    const { headerFilterForm } = this.state;
    const {
      languageParams: { language },
      location,userForms
    } = this.props;
    const isApprover = routeService.isApproverFromLocation(location);
    
    if(userForms.approverFormNames.length !==0 && (headerFilterForm.components 
      &&  parseInt(headerFilterForm.components[ 1 ].columns[ 3 ].components[ 0 ].data.values.length) <=1)){
      const formNameSelect = headerFilterForm.components[ 1 ].columns[ 3 ].components[ 0 ];
    
      const values = [];
      userForms.approverFormNames.push('All');
      (userForms.approverFormNames).map((value) =>values.push({ label: value, value }));
      
      formNameSelect.data = { values };
      formNameSelect.defaultValue = "All";
    }
    const options = {
      readOnly: !(
       
        location.pathname === routeService.getPagePath.formsList(language) ||
        location.pathname === `${ routeService.getPagePath.formsList(language) }/`
      ) &&  !isApprover ,
    };
    
    return (
        <div>
            <div className="pep-header">
         
                {headerFilterForm ? (
                    <ReactForm
              form={ headerFilterForm }
              onChange={ (changes) => {
                if (changes.changed) {
                  this.props.onFiltersChange(changes.data);
                }
              } }
              ref={ (instance) => {
                if (instance) {
                  instance.createPromise.then(() => {
                    this.webform = instance.formio;
                    const properties = { ...this.webform._form.properties };                    
                    this.webform._form.properties.isHidden = false;
               if(isApprover!==undefined){
                    this.webform._form.properties.isHidden = isApprover;
                }
                   
                    if (typeof properties.isHidden !== 'undefined') {
                      this.webform.rebuild();
                    }
                  });
                }
              } }
              options={ {
                ...{
                  template: 'bootstrap',
                  iconset: 'fa',
                  language: `${ language }`,
                },
                ...options,
              } }
              areFilters={ true }
            />
          ) : (
              <div className="rt-sec">
                  <div className="rt rt-4"></div>
                  <div className="rt rt-4"></div>
                  <div className="rt rt-4"></div>
                  <div className="rt rt-4"></div>
                  <div className="clearfix"></div>
              </div>
          )}
            </div>
            <Switch>
                <Route
            exact
            path={ routeService.getPagePath.formsList(language) }
            component={ List }
          />
                <Route
            path={ routeService.getPagePath.form(language, ':formId') }
            component={ Item }
          />
            </Switch>
        </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    languageParams: selectRoot('languageParams', state),
    auth: selectRoot('auth', state),
    headerFilterForm: selectRoot('headerFilterForm', state),
    userForms: selectRoot('userForms', state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onFiltersChange: (filters) => {
    
      if((filters.toDate === undefined && filters.fromDate === undefined) && filters.date!==undefined && filters.date!==''){
        filters.toDate = filters.date;
        filters.fromDate = filters.date;
      }
      window.sessionStorage.setItem('filters', JSON.stringify(filters));
      dispatch(setFiltersValue(filters));
    },
    getHeaderFilterForm: (cb) =>
      dispatch(getForm('headerFilterForm', Forms.HeaderFilter.id, cb)),
    getUserAccess: (gpid, email, user, cb) =>
      dispatch(getAccessByGpid(gpid, email, user, cb)),
    // getDataSet: () => dispatch(getDataSet()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);
