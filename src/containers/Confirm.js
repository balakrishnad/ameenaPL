import React, { Component } from 'react';
import { i18next } from '../i18n';
import { PropTypes } from 'prop-types';
export default class extends Component {
  static propTypes = {
    onYes: PropTypes.func,
    onNo: PropTypes.func,
    message: PropTypes.string,
    yesText: PropTypes.string,
    noText: PropTypes.string,
  };

  render() {
    const { onYes, onNo, message, yesText = 'Yes', noText = 'No' } = this.props;
    return (
        <div>
            <h3>{message}</h3>
            <div className="btn-toolbar">
                <span onClick={ onYes } className="btn btn-danger">
                    {i18next.t(yesText)}
                </span>
                <span onClick={ onNo } className="btn btn-default">
                    {i18next.t(noText)}
                </span>
            </div>
        </div>
    );
  }
}
