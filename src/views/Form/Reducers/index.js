/* eslint no-use-before-define: 0 */
import * as actionTypes from '../Actions/ActionTypes';
import {
  filtersState,
  languageState,
  userFormsState,
  offlineQueueState,
  approverState,
} from './InitialState';

export const filtersReducer = (state = filtersState, action) => {
  switch (action.type) {
    case actionTypes.SET_FILTERS_VALUE:
      return setFiltersValue(state, action);
    default:
      return state;
  }
};

export const languageReducer = (state = languageState, action) => {
  switch (action.type) {
    case actionTypes.SET_LANGUAGE:
      return setLanguage(state, action);
    default:
      return state;
  }
};

export const userFormsReducer = (state = userFormsState, action) => {
  switch (action.type) {
    case actionTypes.REQUEST_USER_FORMS:
      return setUserFormsLoading(state, action);
    case actionTypes.SET_USER_FORMS:
      return setUserForms(state, action);
    case actionTypes.USER_FORMS_ERROR:
      return setUserFormsError(state, action);
    default:
      return state;
  }
};

export const offlineQueueReducer = (state = offlineQueueState, action) => {
  switch (action.type) {
    case actionTypes.SUBMISSIONS_DEQUEUING_START:
      return setOfflineQueueStarted(state, action);
    case actionTypes.SUBMISSIONS_DEQUEUING_FINISH:
      return setOfflineQueueFinished(state, action);
    default:
      return state;
  }
};

export const approverReducer = (state = approverState, action) => {
  switch (action.type) {
    case actionTypes.IS_APPROVER_FLOW:
      return approverFlowStarted(state, action);
    case actionTypes.IS_USER_FLOW:
      return approverFlowEnded(state, action);
    default:
      return state;
  }
};


const setFiltersValue = (state, action) => {
  return {
    ...state,
    ...action.filters,
  };
};

const setLanguage = (state, action) => {
  return {
    ...state,
    language: action.language,
    isLanguageChanged:
      typeof action.isLanguageChanged === 'boolean'
        ? action.isLanguageChanged
        : state.isLanguageChanged,
  };
};

const setUserFormsLoading = (state, action) => {
  return {
    ...state,
    isLoading: action.isLoading,
    error: userFormsState.error,
  };
};

const setUserForms = (state, action) => {
  return {
    ...state,
    forms: action.forms || userFormsState.forms,
    categories: action.categories || userFormsState.categories,
    dataSetList: action.dataSetList || userFormsState.dataSetList,
    approverForms: action.approverForms || userFormsState.approverForms,
    approverFormNames: action.approverFormNames || userFormsState.approverFormNames,
    superApprover: action.superApprover || userFormsState.superApprover,
    isLoading: userFormsState.isLoading,
    error: userFormsState.error,
  };
};

const setUserFormsError = (state, action) => {
  return {
    ...state,
    forms: userFormsState.forms,
    error: action.error,
    categories: userFormsState.categories,
    approverForms: userFormsState.approverForms,
    approverFormNames: userFormsState.approverFormNames,
    superApprover: userFormsState.superApprover ,
    dataSetList: userFormsState.dataSetList,
  };
};

const setOfflineQueueFinished = (state, action) => {
  return {
    ...state,
    dequeuing: false,
  };
};

const setOfflineQueueStarted = (state, action) => {
  return {
    ...state,
    dequeuing: true,
  };
};

const approverFlowStarted = (state, action) => {
  return {
    ...state,
    approverView: true,
  };
};

const approverFlowEnded = (state, action) => {
  return {
    ...state,
    approverView: false,
  };
};
