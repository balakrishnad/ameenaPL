import * as actionTypes from './ActionTypes';

export function setFiltersValue(filters) {
  return { type: actionTypes.SET_FILTERS_VALUE, filters };
}

export function setLanguage(language, isLanguageChanged) {
  return { type: actionTypes.SET_LANGUAGE, language, isLanguageChanged };
}

export function startSubmissionsDequeuing() {
  return { type: actionTypes.SUBMISSIONS_DEQUEUING_START };
}

export function finishSubmissionsDequeuing() {
  return { type: actionTypes.SUBMISSIONS_DEQUEUING_FINISH };
}

export function setApproverFlow() {
  return { type: actionTypes.IS_APPROVER_FLOW };
}

export function resetApproverFlow() {
  return { type: actionTypes.IS_USER_FLOW };
}
