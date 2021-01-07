/* eslint no-undef: 0 */
import { formConfig } from './formConfig.js';

var PROJECT_URL = '';
const domainUrl = process.env.REACT_APP_DOMAIN
  ? process.env.REACT_APP_DOMAIN
  : 'demo';

let API_URL = process.env.REACT_APP_API_URL;

switch (domainUrl) {
  case 'demo':
    PROJECT_URL = process.env.REACT_APP_DEMO;
    break;
  case 'dev':
    PROJECT_URL = process.env.REACT_APP_DEVELOPMENT;
    break;
  case 'production':
    PROJECT_URL = process.env.REACT_APP_PRODUCTION;
    break;
  case 'qa':
    PROJECT_URL = process.env.REACT_APP_QA;
    break;
  default:
    PROJECT_URL = process.env.REACT_APP_DEMO;
}

// eslint-disable-next-line prefer-const
let query = {};
window.location.search
  .substr(1)
  .split('&')
  .forEach(function (item) {
    query[ item.split('=')[ 0 ] ] =
      item.split('=')[ 1 ] && decodeURIComponent(item.split('=')[ 1 ]);
  });

PROJECT_URL = query.projectUrl || PROJECT_URL;
API_URL = query.apiUrl || API_URL;

export const AppConfig = {
  projectUrl: PROJECT_URL,
  apiUrl: API_URL,
  version: '0.8.6',
};

export const AuthConfig = {
  anonState: '/auth',
  authState: '/',
  login: {
    form: 'user/login',
  },
  register: {
    form: 'user/register',
  },
};

export const PageTexts = {
  IMPORTANT_INSTRUCTIONS_INTRO: 'IMPORTANT_INSTRUCTIONS_INTRO',
  IMPORTANT_INSTRUCTIONS_TEXT: 'IMPORTANT_INSTRUCTIONS_TEXT',
  DELETE_BUTTON_TEXT: 'DELETE_BUTTON_TEXT',
  REJECT_BUTTON_TEXT: 'REJECT_BUTTON_TEXT',
  SUBMIT_FOR_APPROVAL: 'SUBMIT_FOR_APPROVAL',
  BACK: 'BACK',
  BACK_TO_APPROVER: 'BACK_TO_APPROVER',
  APPROVE_FORM:'APPROVE_FORM',
  APPROVE_SHIFT:'AAPPROVE_SHIFT',
  SAVE: 'SAVE',
  SUBMIT_AND_END_SHIFT: 'SUBMIT_AND_END_SHIFT',
  COMMON_FOR_SHIFT: 'COMMON_FOR_SHIFT',
};

export const UserMessages = {
  NO_RECORDS: 'NO_RECORDS',
  NO_RECORDS_DAY: 'NO_RECORDS_DAY',
  SHIFT_ENDED_TEXT: 'SHIFT_ENDED_TEXT',
  SHIFT_APPROVED:'SHIFT_APPROVED',
  SHIFT_PENDING_APPROVAL:'SHIFT_PENDING_APPROVAL',
  RECORDS_NOT_ADDED: 'RECORDS_NOT_ADDED',
  SHIFT_INSTRUCTIONS_TEXT: 'SHIFT_INSTRUCTIONS_TEXT',
  SHIFT_APPROVE_INSTRUCTIONS_TEXT: 'SHIFT_APPROVE_INSTRUCTIONS_TEXT',
  SHIFT_DRAFT_RECORD_ALERT: 'SHIFT_DRAFT_RECORD_ALERT',
  DELETE_MESSAGE_CONFIRM: 'DELETE_MESSAGE_CONFIRM',
  REJECT_FORM_CONFIRM: 'REJECT_FORM_CONFIRM',
  DRAFT_WILL_NOT_BE_SAVED: 'DRAFT_WILL_NOT_BE_SAVED',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RECORD_SELECTED: 'RECORD_SELECTED',
  DRAFT_SUBMISSION_PRESENT: 'DRAFT_SUBMISSION_PRESENT',
  SELECT_DETAILS: 'SELECT_DETAILS',
  DATA_SAVED: 'DATA_SAVED',
};
export const Logout={
  url: formConfig.Logout[ process.env.REACT_APP_DOMAIN ],
};
export const Forms = {
  Cleanliness: {
    id: formConfig.Cleanliness[ process.env.REACT_APP_DOMAIN ],
    url: `${ PROJECT_URL }/cleanlinesfollowup`,
  },
  Signature: {
    id: formConfig.Signature[ process.env.REACT_APP_DOMAIN ],
    url: `${ PROJECT_URL }/signature`,
  },
  Line: {
    id: formConfig.Line[ process.env.REACT_APP_DOMAIN ],
  },
  Report: {
    id: formConfig.Report[ process.env.REACT_APP_DOMAIN ],
    url: `${ PROJECT_URL }/inprogressreport`,
  },
  HeaderFilter: {
    id: formConfig.HeaderFilter[ process.env.REACT_APP_DOMAIN ],
    url: `${ PROJECT_URL }/headerformsfilter`,
  },
  FryerControl: {
    id: formConfig.FryerControl[ process.env.REACT_APP_DOMAIN ],
    url: `${ PROJECT_URL }/fryercontrol`,
  },
  ConsumptionReport: {
    id: formConfig.ConsumptionReport[ process.env.REACT_APP_DOMAIN ],
  },
  Followuponachievingplan: {
    id: formConfig.Followuponachievingplan[ process.env.REACT_APP_DOMAIN ],
  },
  PAE: {
    id: formConfig.PAE[ process.env.REACT_APP_DOMAIN ],
  },
  CS59: {
    id: formConfig.CS59[ process.env.REACT_APP_DOMAIN ],
  },
  PC7: {
    id: formConfig.PC7[ process.env.REACT_APP_DOMAIN ],
  },
};

export const Resources = {
  Gpid: {
    id: formConfig.Gpid[ process.env.REACT_APP_DOMAIN ],
    url: `${ PROJECT_URL }/gpid`,
  },
  UserAccess: {
    id: formConfig.UserAccess[ process.env.REACT_APP_DOMAIN ],
    url: `${ PROJECT_URL }/useraccess`,
  },
  Roles: {
    id: formConfig.Roles[ process.env.REACT_APP_DOMAIN ],
    url: `${ PROJECT_URL }/roles`,
  },
  Forms: {
    id: formConfig.Forms[ process.env.REACT_APP_DOMAIN ],
    url: `${ PROJECT_URL }/forms`,
  },
  DataSet: {
    id: formConfig.DataSet[ process.env.REACT_APP_DOMAIN ],
    url: `${ PROJECT_URL }/dataset`,
  },
 
};

export const UserRole = {
  Authenticated: {
    id: formConfig.Authenticated[ process.env.REACT_APP_DOMAIN ],
  },
};
export const OfflinePluginConfig = {
  noAutomaticDequeue: true,
  queryFiltersTypes: {
    'data.plantId': 'number',
  },
  notToShowDeletedOfflineSubmissions: true,
};
