/* eslint no-useless-escape: 0 */
/* eslint no-useless-computed-key: 0 */
import moment from 'moment-timezone';
import { Forms,AppConfig,OfflinePluginConfig } from '../config';
// import FormioOfflineProject from 'formio-plugin-offline';

// const offlinePlugin = FormioOfflineProject.getInstance(
//   AppConfig.projectUrl,
//   AppConfig.projectUrl,
//   OfflinePluginConfig
// );

export const createDateRange = (date) => {
  const dateFrom = new Date(date);
  const range = {};
  const dateFromObject = {
    year: dateFrom.getFullYear(),
    month: dateFrom.getMonth(),
    day: dateFrom.getDate(),
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  };
  range.from = moment
    .tz(dateFromObject, 'Etc/UTC')
    .format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');

  const dateToObject = {
    ...dateFromObject,
    hour: 23,
    minute: 59,
    second: 59,
  };
  range.to = moment
    .tz(dateToObject, 'Etc/UTC')
    .format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');

  return range;
};

export const getFormName = ({
  formReference = '',
  formNameDescription = '',
}) => {
  return `${ formReference.toLowerCase() }${ formNameDescription
    .toLowerCase()
    .replace(/\ /g, '') }`;
};

export const normalizeDataSetCategory = (name = '') => {
  return `${ (name[ 0 ] || '').toLowerCase() }${ name.replace(/\ /g, '').substr(1) }`;
};

export const getQueryObject = (filters, additionalFields) => {
  const range = createDateRange(filters.date);

  return {
    [ 'data.date__gte' ]: range.from,
    [ 'data.date__lte' ]: range.to,
    [ 'data.line' ]: filters.line,
    [ 'data.plant' ]: filters.plant,
    [ 'data.shift' ]: filters.shift,
    ...additionalFields,
  };
};



/**Check if a signature exists in offline queue-If so diable the add/edit/delete/end submit features {LN} starts*/
export const signatureOffline = (formId,filters) => {
  // const isOfflineSubmissionsForForm = offlinePlugin.submissionQueue.some(offlineSubmission => {
  //   return offlineSubmission.request.data &&
  //     offlineSubmission.request.data.data.formId === formId &&
  //     (offlineSubmission.request.form === Forms.Signature.id || offlineSubmission.request.data.data.userSignature || offlineSubmission.request.data.data.userSignature === '') &&
  //     offlineSubmission.request.data.data.line === filters.line &&
  //     parseInt(offlineSubmission.request.data.data.plant) === filters.plant &&
  //     offlineSubmission.request.data.data.shift === filters.shift &&
  //     (offlineSubmission.request.data.data.date).includes((filters.date).split('T')[ 0 ])
  // });
  // return isOfflineSubmissionsForForm;
};
/**Check if a signature exists in offline queue-If so diable the add/edit/delete/end submit features {LN} ends*/

/**Default Query generator based on the form pages /resources [LN] code starts*/
export const getSubmissionDefaultQuery=(form,filters,userForms,formId) => {
  // eslint-disable-next-line no-unused-vars
  
 const range = createDateRange(filters.date);
 const query = getQueryObject(filters, { limit: 999999 });
 let defaultQuery=[];
 if(form && form.type ==='resource'){
   defaultQuery={
     limit: 999999,
   };
 }
 else if(Forms.Signature.id === formId  && filters.approvalStatus!== '' && filters.formShift!==''
 && userForms !==null && userForms.approverForms !==null && userForms.approverFormNames!==null){
   
   const approverForms=userForms.approverForms;
   let formName=userForms.approverFormNames;
   if(filters.formName !=='All' && filters.formName !==''){
     formName=filters.formName;
   }
         
   let toDate=filters.toDate.split('T')[ 0 ];
   toDate+='T23:59:59+05:30';
     defaultQuery= {
       [ 'data.date__gte' ]: filters.fromDate,
       [ 'data.date__lte' ]: toDate,
        [ 'data.formId__in' ]: approverForms,
        [ 'data.plant' ]: filters.plant,
        [ 'data.formStatus__in' ]: filters.approvalStatus,
        [ 'data.shift__in' ]: filters.formShift,
         [ 'data.formName__in' ]: formName,
        limit: 999999,
      };
  
 }
 else if (
   form &&
   form.properties &&
   form.properties.formType &&
   form.properties.formType === 'dayLevel'
 ) {
   defaultQuery= {
     [ 'data.date__gte' ]: range.from,
     [ 'data.date__lte' ]: range.to,
     [ 'data.line' ]: filters.line,
     [ 'data.plant' ]: filters.plant,
     limit: 999999,
   };
 } 
 else if(form && form.type ==='resource'){
   defaultQuery= {
     limit: 999999,
   };
 }
 else {
   defaultQuery=query;
 }
 return defaultQuery;
};
/**Default Query generator based on the form pages /resources [LN] code ends*/