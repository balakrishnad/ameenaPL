/* eslint no-undef: 0 */
import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import EventEmitter from 'eventemitter2';
import AllComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';
import FormioForm from 'formiojs/Form';
import { translationConfig } from '../i18n';

Components.setComponents(AllComponents);

export default class Form extends Component {
  static propTypes = {
    src: PropTypes.string,
    url: PropTypes.string,
    form: PropTypes.object,
    submission: PropTypes.object,
    areFilters: PropTypes.bool,
    pageToSet: PropTypes.any,
    options: PropTypes.shape({
      readOnly: PropTypes.bool,
      noAlerts: PropTypes.bool,
      i18n: PropTypes.object,
      template: PropTypes.string,
      saveDraft: PropTypes.bool,
      language:PropTypes.string
    }),
    onPrevPage: PropTypes.func,
    onNextPage: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func,
    onCustomEvent: PropTypes.func,
    onComponentChange: PropTypes.func,
    onSubmit: PropTypes.func,
    onSubmitDone: PropTypes.func,
    onSaveDraftBegin: PropTypes.func,
    onSaveDraft: PropTypes.func,
    onFormLoad: PropTypes.func,
    onError: PropTypes.func,
    onRender: PropTypes.func,
    onAttach: PropTypes.func,
    onBuild: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onInitialized: PropTypes.func,
    formioform: PropTypes.any
  };

  static getDefaultEmitter() {
    return new EventEmitter({
      wildcard: false,
      maxListeners: 0,
    });
  }

  addLanguageTranslationOption(options) {
    return { ...options, i18n: translationConfig.formsConfig };
  }

  setFilterValues() {
    if (this.props.areFilters) {
      const filterValues = JSON.parse(window.sessionStorage.getItem('filters'));

      if (filterValues) {
        this.formio.data = filterValues;
        this.formio.setSubmission({ data: filterValues });
      }
    }
  }

  componentDidMount = () => {
    const { src, url, form, pageToSet } = this.props;
    let { options = {} } = this.props;
    options = this.addLanguageTranslationOption(options);

    if (!options.events) {
      options.events = Form.getDefaultEmitter();
    }

    if (src) {
      this.instance = new (this.props.formioform || FormioForm)(
        this.element,
        src,
        options
      );
      this.createPromise = this.instance.ready.then((formio) => {
        this.formio = formio;
        this.formio.src = src;
        this.setFilterValues();
      });
    }
    if (form) {
      this.instance = new (this.props.formioform || FormioForm)(
        this.element,
        form,
        options
      );
      this.createPromise = this.instance.ready.then((formio) => {
        this.formio = formio;
        this.formio.form = form;
        if (url) {
          this.formio.url = url;
        }
        this.setFilterValues();
        if (pageToSet) {
          return this.formio.setPage(Number.parseFloat(pageToSet));
        }
        return this.formio;
      });
    }

    this.initializeFormio();
  };

  componentWillUnmount = () => {
    if (this.formio !== undefined) {
      this.formio.destroy(true);
    }
  };

  initializeFormio = () => {
    if (this.createPromise) {
      this.instance.onAny((event, ...args) => {
        if (event.startsWith('formio.')) {
          const funcName = `on${ event.charAt(7).toUpperCase() }${ event.slice(
            8
          ) }`;
          if (
            this.props.hasOwnProperty(funcName) &&
            typeof this.props[ funcName ] === 'function'
          ) {
            this.props[ funcName ](...args);
          }
        }
      });
      this.createPromise.then(() => {
        if (this.props.submission) {
          this.formio.submission = this.props.submission;
        }
      });
    }
  };

  componentWillReceiveProps = (nextProps) => {
    const { src, url, form, submission } = this.props;
    let { options = {} } = this.props;
    options = this.addLanguageTranslationOption(options);

    if (
      (form || src) &&
      (options.language !== nextProps.options.language ||
        options.readOnly !== nextProps.options.readOnly)
    ) {
      const nextOptions = this.addLanguageTranslationOption(nextProps.options);

      if (src) {
        this.instance = new (this.props.formioform || FormioForm)(
          this.element,
          src,
          nextOptions
        );
        this.createPromise = this.instance.ready.then((formio) => {
          this.formio = formio;
          this.formio.src = src;
          this.setFilterValues();
        });
      }

      if (form) {
        this.instance = new (this.props.formioform || FormioForm)(
          this.element,
          form,
          nextOptions
        );
        this.createPromise = this.instance.ready.then((formio) => {
          this.formio = formio;
          this.formio.form = form;
          if (url) {
            this.formio.url = url;
          }
          this.setFilterValues();
          if (nextProps.pageToSet) {
            return this.formio.setPage(Number.parseFloat(nextProps.pageToSet));
          }
          return this.formio;
        });
      }
      this.initializeFormio();
    }

    if (!options.events) {
      options.events = Form.getDefaultEmitter();
    }

    if (src !== nextProps.src) {
      this.instance = new (this.props.formioform || FormioForm)(
        this.element,
        nextProps.src,
        options
      );
      this.createPromise = this.instance.ready.then((formio) => {
        this.formio = formio;
        this.formio.src = nextProps.src;
      });
      this.initializeFormio();
    }
    if (form !== nextProps.form) {
      this.instance = new (this.props.formioform || FormioForm)(
        this.element,
        nextProps.form,
        options
      );
      this.createPromise = this.instance.ready.then((formio) => {
        this.formio = formio;
        this.formio.form = nextProps.form;
      });
      this.initializeFormio();
    }

    if (submission !== nextProps.submission && this.formio) {
      this.formio.submission = nextProps.submission;
    }
  };

  render = () => {
    return <div ref={ (element) => (this.element = element) } />;
  };
}
