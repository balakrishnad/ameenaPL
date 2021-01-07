import { combineReducers } from 'redux';
import { auth, form, forms, submission, submissions } from 'react-formio';
import {
  filtersReducer as filters,
  languageReducer as languageParams,
  userFormsReducer as userForms,
  // dataSetReducer as dataSet,
  offlineQueueReducer as offlineQueue,
  approverReducer as approverFlowCheck,
} from './views/Form/Reducers';

export default combineReducers({
  auth: auth(),
  form: form({ name: 'form' }),
  headerFilterForm: form({ name: 'headerFilterForm' }),
  forms: forms({ name: 'forms', query: { type: 'form' } }),
  submission: submission({ name: 'submission' }),
  submissions: submissions({ name: 'submissions' }),
  signatures: submissions({ name: 'signatures' }),
  signature: submission({ name: 'signature' }),
  user: submissions({ name: 'user' }),
  userAccess: submissions({ name: 'userAccess' }),
  userRoles: submissions({ name: 'userRoles' }),
  formSubmissions: submissions({ name: 'formSubmissions' }),
  //offlineSubmissions: submissions({ name: 'offlineSubmissions' }),
  filters,
  languageParams,
  userForms,
  offlineQueue,
  approverFlowCheck,
});
