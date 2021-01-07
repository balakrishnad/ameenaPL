/* eslint no-undef: 0 */
import arTranslation from './translations/ar';
import enTranslation from './translations/en';
import routeService from '../services/routeService';

const translationConfig = {
  defaultLanguage:
    routeService.getLanguageFromHash(window.location.hash) || 'en',
  formsConfig: { ...arTranslation, ...enTranslation },
  i18nConfig: {
    en: { translation: enTranslation.en },
    ar: { translation: arTranslation.ar },
  },
  availableLanguages: [ 'ar', 'en' ],
};

export default translationConfig;
