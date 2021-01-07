import { translationConfig } from '../../../i18n';

export const filtersState = {
  date: '',
  plant: '',
  line: '',
  shift: '',
  fromDate:'',
  toDate:'',
  submitter:'',
  formName:'',
  approvalStatus:'',
  formShift:'',
};

export const languageState = {
  language: translationConfig.defaultLanguage,
  isLanguageChanged: false,
};

export const userFormsState = {
  forms: [],
  categories: [],
  dataSetList: [],
  approverForms: [],
  approverFormNames: [],
  superApprover:false,
  isLoading: false,
  error: null,
};


export const offlineQueueState = {
  dequeuing: false,
};
export const approverState = {
  approverView: false,
};
