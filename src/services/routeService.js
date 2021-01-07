/* eslint no-undef: 0 */
import qs from 'qs';

import { Forms } from '../config';
export default class routeService {
  static getLanguageFromHash(hash) {
    const locationParts = hash.split('/');

    if (locationParts[ 0 ] === '#') {
      locationParts.shift();
    }

    return locationParts[ 0 ];
  }

  static getCurrentPageNumberFromLocation(location) {
    return qs.parse(location.search, { ignoreQueryPrefix: true }).page !==
      undefined
      ? qs.parse(location.search, { ignoreQueryPrefix: true }).page
      : 0;
  }
  static isApproverFromLocation(location) {
  
    return location.pathname.split('form/')[ 1 ] !== undefined ? 
    (location.pathname.split('form/')[ 1 ]).includes(Forms.Signature.id): false;
  
  }

  static getPagePath = {
    auth(language) {
      return `/${ language }/auth`;
    },
    formsList(language) {
      return `/${ language }/form`;
    },
    submission(language, formId) {
      return `/${ language }/form/${ formId }/submission`;
    },
    approver(language, formId) {
      return `/${ language }/form/${ formId }/submission?approverFlow`;
    },
    submissionPage(language, formId, pageNumber) {
      return `/${ language }/form/${ formId }/submission?page=${ pageNumber }`;
    },
    submissionDetails(language, formId, submissionId) {
      return `/${ language }/form/${ formId }/submission/${ submissionId }`;
    },
    submissionDetailsPage(language, formId, submissionId, currentPage) {
      return `/${ language }/form/${ formId }/submission/${ submissionId }?page=${ currentPage }`;
    },
    formPage(language, formId, pageNumber) {
      return `/${ language }/form/${ formId }?page=${ pageNumber }`;
    },
    form(language, formId) {
      return `/${ language }/form/${ formId }`;
    },
    edit(language, formId) {
      return `/${ language }/form/${ formId }/edit`;
    },
    delete(language, formId) {
      return `/${ language }/form/${ formId }/delete`;
    },
    reject(language, formId) {	
      return `/${ language }/form/${ formId }/reject`;	
    },
    editSubmissionCommon(language, formId, submissionId) {
      return `/${ language }/form/${ formId }/submission/${ submissionId }/edit`;
    },
    editSubmission(language, formId, submissionId, currentPage) {
      return `/${ language }/form/${ formId }/submission/${ submissionId }/edit?page=${ currentPage }`;
    },
    deleteSubmissionCommon(language, formId, submissionId) {
      return `/${ language }/form/${ formId }/submission/${ submissionId }/delete`;
    },
    rejectSubmissionCommon(language, formId, submissionId) {	
      return `/${ language }/form/${ formId }/submission/${ submissionId }/reject`;
    },
    deleteSubmission(language, formId, submissionId,currentPage,path="delete") {	
      return `/${ language }/form/${ formId }/submission/${ submissionId }/${path}?page=${ currentPage }`;	
    },	
    
    signature(language, formId) {
      return `/${ language }/form/${ formId }/signature`;
    },
  };
}
