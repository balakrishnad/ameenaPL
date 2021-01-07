import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import { setLanguage } from '../views/Form/Actions';
import { selectRoot } from 'react-formio';
import { RouteComponentProps } from 'react-router-dom';
import { history } from '../store';
import { i18next } from '../i18n';

const LanguageProvider = class extends Component {
  setLanguage(language) {
    this.props.setLanguage(language);
    i18next.changeLanguage(language);
  }

  render() {
    const {
      languageParams: { language },
    } = this.props;
    return (
        <div className="btn-group">
            <button
          type="button"
          className={ `${
            language === 'en' ? 'btn btn-primary btn-active' : 'btn btn-primary'
          }` }
          onClick={ () => this.setLanguage('en') }
        >
                English
            </button>
            <button
          type="button"
          className={ `${
            language === 'ar' ? 'btn btn-primary btn-active' : 'btn btn-primary'
          }` }
          onClick={ () => this.setLanguage('ar') }
        >
                عربي
            </button>
        </div>
    );
  }
};
LanguageProvider.propTypes = {
  setLanguage: PropTypes.func,
  languageParams: PropTypes.object
 
 };

const mapStateToProps = (state) => {
  return {
    languageParams: selectRoot('languageParams', state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setLanguage: (language) => {
      dispatch(setLanguage(language));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LanguageProvider);
