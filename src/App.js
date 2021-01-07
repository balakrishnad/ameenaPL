/* eslint no-undef: 0 */
import React, { Component } from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';
import { Redirect } from 'react-router';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { selectRoot } from 'react-formio';
import { setLanguage } from './views/Form/Actions';
import { i18next } from './i18n';
import Header from './containers/Header/Header';
import Form from './views/Form';
import Auth from './views/Auth/Auth';
import routeService from './services/routeService';

const App = class extends Component {
  componentWillReceiveProps() {
    const languageInHash =
      routeService.getLanguageFromHash(window.location.hash) !== undefined
        ? routeService.getLanguageFromHash(window.location.hash)
        : 'en';

    const {
      languageParams: { language },
      setLanguage,
      auth: { user },
    } = this.props;
    const userSettingsLanguage =
      user && user.data.language ? user.data.language : 'en';
    if (
      languageInHash !== language &&
      i18next.languages.some((existingLng) => existingLng === languageInHash)
    ) {
      userSettingsLanguage === languageInHash || !userSettingsLanguage
        ? setLanguage(languageInHash, false)
        : setLanguage(languageInHash, true);
      i18next.changeLanguage(languageInHash);
    }
  }

  render() {
    const {
      auth,
      languageParams: { language, isLanguageChanged },
    } = this.props;

    return (
        <div className={ `${ language === 'ar' ? 'rtl' : '' }` }>
            <Header />
            <div className="container" id="main">
                <Switch>
                    {auth.authenticated ? (
                        <Route
                path={ routeService.getPagePath.formsList(':lang') }
                component={ Form }
              />
            ) : (
                <Route
                path={ routeService.getPagePath.auth(':lang') }
                component={ Auth }
              />
            )}
                    {auth.isActive ? null : auth.authenticated ? (
                        <Redirect
                from="/"
                to={ routeService.getPagePath.formsList(
                  isLanguageChanged
                    ? language
                    : auth.user.data.language !== undefined
                    ? auth.user.data.language
                    : language
                ) }
              />
            ) : (
                <Redirect from="/" to={ routeService.getPagePath.auth(language) } />
            )}
                </Switch>
            </div>
        </div>
    );
  }
};
App.propTypes = {
  auth: PropTypes.object,
  languageParams: PropTypes.object,
  setLanguage: PropTypes.func

};

const mapStateToProps = (state) => {
  return {
    auth: selectRoot('auth', state),
    languageParams: selectRoot('languageParams', state),
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    setLanguage: (language, isLanguageChanged) => {
      dispatch(setLanguage(language, isLanguageChanged));
    },
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
