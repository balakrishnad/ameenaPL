/* eslint no-undef: 0 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import { Link } from 'react-router-dom';
import { push } from 'connected-react-router';
import { selectRoot, logout, resetForm,Formio } from 'react-formio';
import NavLink from '../NavLink';
import { i18next } from '../../i18n';
import { AuthConfig,Logout } from '../../config';
import { setLanguage } from '../../views/Form/Actions';
import routeService from '../../services/routeService';

const Header = class extends Component {
  static propTypes = {
    auth: PropTypes.object.isRequired,
    logout: PropTypes.func.isRequired,
  };

  render() {
    const {
      auth,
      logout,
      languageParams: { language },
    } = this.props;
    return (
        <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container">
                <Link
            className="navbar-brand"
            to={ routeService.getPagePath.formsList(language) }
          >
                    <img
              className="logo"
              alt="PepsiCo"
              src="./pepsico_logo.png"
              height="45px"
            />
                </Link>
                {/* <ul className="nav navbar-nav mr-auto">
            <NavLink to={routeService.getPagePath.formsList(language)} role="navigation link" className="nav-link">
              <i className="fa fa-wpforms"></i>&nbsp;
              {i18next.t('Forms')}
            </NavLink>
          </ul> */}
                <ul className="nav navbar-nav ml-auto">
                    {auth.authenticated ? (
                        <li className="nav-item profile">
                            <span className="profile_name">
                                {i18next.t(auth.user.data.name)}
                                <span className="profile_icon fa fa-user-circle-o" />
                            </span>
                            <span
                  className="nav-link"
                  role="navigation link"
                  onClick={ () => logout(language,Formio) }
                >
                                <span className="fa fa-sign-out" />
                  &nbsp;
                                {i18next.t('Logout')}
                            </span>
                        </li>
            ) : (
                <NavLink
                to={ routeService.getPagePath.auth(language) }
                role="navigation link"
                className="nav-link"
              >
                    {i18next.t('Login')}
                </NavLink>
            )}
                </ul>
            </div>
        </nav>
    );
  }
};
Header.propTypes = {
  languageParams:PropTypes.object
  };
const mapStateToProps = (state) => {
  return {
    auth: selectRoot('auth', state),
    languageParams: selectRoot('languageParams', state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    logout: (language,formio) => {
   //   window.open('https://sso.ite.mypepsico.com/login/logout.jsp');
      const url=Logout.url
      window.open(url);
      window.sessionStorage.removeItem('filters');
      dispatch(logout());
      dispatch(push(`/${ language }${ AuthConfig.anonState }`));
      dispatch(resetForm('headerFilterForm'));
      formio.setToken(null);
      formio.setUser(null);
      window.location.reload(true);
    },
    setLanguage: (language) => {
      dispatch(setLanguage(language));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Header);
