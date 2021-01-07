import i18next from 'i18next';
import translationConfig from '../../translationConfig';

i18next.init({
  lng: translationConfig.defaultLanguage,
  debug: false,
  resources: { ...translationConfig.i18nConfig },
  fallbackLng: translationConfig.availableLanguages,
  keySeparator: false,
  ns: [ 'translation' ],
  nsSeparator: false,
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false,
    formatSeparator: ',',
  },
  react: {
    wait: true,
    useSuspense: false,
  },
});

export default i18next;
