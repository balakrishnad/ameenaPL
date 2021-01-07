import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setUser, selectRoot, Formio } from 'react-formio';
import PropTypes from 'prop-types';
import Form from '../../containers/Form';
import LogMessage from '../../containers/LogFile';
import { push } from 'connected-react-router';
import { AppConfig, AuthConfig,UserRole } from '../../config';
import store from '../../store';
const Login = class extends Component {
  componentDidMount() {
    if (Formio.pageQuery().saml) {
      const sso = Formio.ssoInit('saml');
      if (sso) {
        sso.then((user) => {
          user.data.gpid=parseInt(user.data.nameID);
           /** Set user role to authenticated if empty  */   
          if( user.roles.length=== 0){                
            user.roles.push(UserRole.Authenticated.id);
          }
          LogMessage.info(user, 'SAML--');
          setUser(user);
          store.dispatch(setUser(user));
        });
      }
    }
  }

  render() {
    const {
      languageParams: { language },
    } = this.props;
    const formParameters = {
      options: { language: `${ language }` },
      ...this.props,
    };

    return <Form { ...formParameters } />;
  }
};
Login.propTypes = {
  languageParams: PropTypes.object
 
 };
const mapStateToProps = (state) => {
  return {
    src: AppConfig.projectUrl + '/' + AuthConfig.login.form,
    languageParams: selectRoot('languageParams', state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onSubmitDone: (submission) => {
      LogMessage.info(submission, 'Login.js- onSubmitDone');
      dispatch(push(`/${ submission.data.language }${ AuthConfig.authState }`));
      dispatch(setUser(submission));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);
