/* eslint no-useless-computed-key: 0 */
/* eslint no-undef: 0 */
import { getSubmissions, indexForms, setUser } from 'react-formio';
import { getFormName } from '../../../utils';
import { Resources,UserRole } from '../../../config';
import * as actionTypes from './ActionTypes';

/**Add GPID from SAML login [LN] Starts*/
export const getUserByEmail = (email, user, callback = () => {}) => (
  dispatch
) => {
  dispatch(
    getSubmissions(
      'user',
      1,
      { limit: 999999, [ 'data.email' ]: email },
      Resources.Gpid.id,
      (err, result) => {
        if (err || !result) {
          return callback(err);
        }
        /**Random user-User not available in the db flow Starts*/
        let userGpid = 10000001;
        /**Random user-User not available in the db flow ends*/
        if (result.length !== 0) {
          userGpid = result[ 0 ] && result[ 0 ].data && result[ 0 ].data.gpid;
        }

        user.data.gpid = userGpid;
        dispatch(setUser(user));
        return callback(null, userGpid);
      }
    )
  );
};
/**Add GPID from SAML login [LN] Ends*/

export const getDataSetList = (callback = () => {}) => (dispatch) => {
  dispatch(
    getSubmissions(
      'formSubmissions',
      1,
      { limit: 999999 },
      Resources.DataSet.id,
      (err, result) => {
        if (err || !result) {
          return callback(err);
        }
        return callback(null, result);
      }
    )
  );
};
export const getAccessByGpid = (gpid, email, user, callback = () => {}) => (
  dispatch
) => {
  if (gpid === '' || gpid === undefined) {
    dispatch(
      getUserByEmail(email, user, (err, access) => {
        if (err) {
          dispatch({ type: actionTypes.USER_FORMS_ERROR, error: err });
          return callback(err);
        }
        // eslint-disable-next-line no-param-reassign
        gpid = access;
        dispatch(
          getSubmissions(
            'userAccess',
            1,
            { limit: 999999, [ 'data.gpid' ]: gpid },
            Resources.UserAccess.id,
            (err, result) => {
              if (err || !result) {
                return callback(err);
              }

              return callback(null, result);
            }
          )
        );
      })
    );
  } else {
    dispatch(
      getSubmissions(
        'userAccess',
        1,
        { limit: 999999, [ 'data.gpid' ]: gpid },
        Resources.UserAccess.id,
        (err, result) => {
          if (err || !result) {
            return callback(err);
          }
          if( ((user.data && user.data.gpid=== undefined) || user.gpid=== undefined) && user.data.nameID !== undefined)
          {
               /**Random user-User not available in the db flow Starts*/
              
              user.data.gpid = gpid;
              if( user.roles.length=== 0){   /** Set user role to authenticated if empty  */            
                user.roles.push(UserRole.Authenticated.id);
              }
              /**Random user-User not available in the db flow ends*/
              if (result.length === 0) {
                user.data.gpid = 10000001;
              }
              dispatch(setUser(user));
          }

          return callback(null, result);
        }
      )
    );
  }
};

export const getRolesByIds = (ids = [], callback = () => {}) => (dispatch) => {
  dispatch(
    getSubmissions(
      'userRoles',
      1,
      { limit: 999999 },
      Resources.Roles.id,
      (err, result) => {
        if (err || !result) {
          return callback(err);
        }

        const validRoles = result.filter(({ data }) =>
          ids.includes(data.roleId)
        );
        return callback(null, validRoles);
      }
    )
  );
};

export const getFormSubmissionsByIds = (ids = [], callback = () => {}) => (
  dispatch
) => {
  dispatch(
    getSubmissions(
      'formSubmissions',
      1,
      { limit: 999999 },
      Resources.Forms.id,
      (err, result) => {
        if (err || !result) {
          return callback(err);
        }

        const validForms = result.filter(({ data }) =>
          ids.includes(data.formId)
        );
        return callback(null, validForms);
      }
    )
  );
};

export const getUserForms = (
  gpid,
  email,
  user,
  page,
  query = {},
  callback = () => {}
) => (dispatch) => {
  dispatch({ type: actionTypes.REQUEST_USER_FORMS, isLoading: true });

  dispatch(
    getAccessByGpid(gpid, email, user, (err, access) => {
      if (err) {
        dispatch({ type: actionTypes.USER_FORMS_ERROR, error: err });
        return callback(err);
      }

      const roleIds = [];
      access.forEach(({ data }) => roleIds.push(...data.roleId));

      dispatch(
        getRolesByIds(roleIds, (err, roles) => {
          if (err) {
            dispatch({ type: actionTypes.USER_FORMS_ERROR, error: err });
            return callback(err);
          }

          const formIds = [];
          roles.forEach(({ data }) => formIds.push(...data.formId));
          const approverForms =[];
          const approverFormNames =[];
          const approverIds=[];
          let superApprover=false;
          roles.forEach(({ data } ) => {
            if(data.approver === "yes")
            {approverIds.push(...data.formId);}
          });
          roles.forEach(({ data } ) => {
            if(data.superApprover){
              superApprover=true;
          }});
          if(approverIds.length !==0){
            formIds.push(50);
           }
         
          dispatch(
            getFormSubmissionsByIds(formIds, (err, userForms) => {
              if (err) {
                dispatch({ type: actionTypes.USER_FORMS_ERROR, error: err });
                return callback(err);
              }

              const formNames = userForms.map((form) => getFormName(form.data));
              let resources=[];
              dispatch(
                indexForms('forms',  1,
                { limit: 999999, type: 'resource', 'name__in':formNames.join(',')}, (err, resourceList) => {
                  if (resourceList) {
                    resources=resourceList;
                  }

                }));
              query[ 'name__in' ] = formNames.join(',');

              dispatch(
                indexForms('forms', page, query, (err, forms) => {
                  const categoriesSet = new Set();

                  if (forms) {
                
                    forms.push(...resources);

                      
                    forms.forEach((form) => {
                      const formMatch = userForms.find(
                        ({ data }) => form.name === getFormName(data)
                      );
                      if (formMatch) {
                        if(approverIds.includes(formMatch.data.formId)){
                          approverForms.push(form._id);
                          approverFormNames.push(form.title);
                        }
                        form.title = `${ formMatch.data.formReference } ${ formMatch.data.formNameDescription }`;
                        form.formReference = formMatch.data.formReference;
                        form.formNameDescription =
                          formMatch.data.formNameDescription;
                        form.dropDownName = formMatch.data.dropDownName;
                        categoriesSet.add(formMatch.data.dropDownName);
                        form.issueNo=formMatch.data.formIssueNo;
                        form.issueDate=formMatch.data.formIssueDate;
                        form.formId=formMatch.data.formId;
                      
                      }
                    });
                  }

                  const categories = [];
                  categoriesSet.forEach((category) =>
                    categories.push(category)
                  );
                  let dataSetList = [];
                 
                      dispatch(
                        getDataSetList((err, dataList) => {
                          if (err) {
                            dispatch({
                              type: actionTypes.USER_FORMS_ERROR,
                              error: err,
                            });
                            return callback(err);
                          }
                          if (dataList) {
                            dataSetList = dataList;
                          }
                          dispatch({
                            type: actionTypes.SET_USER_FORMS,
                            forms,
                            categories,
                            dataSetList,
                            approverForms,
                            approverFormNames,
                            superApprover,
                          });
                        
                          return callback(null, forms);
                        })
                      );
                })
              );
            })
          );
        })
      );
    })
  );
};
