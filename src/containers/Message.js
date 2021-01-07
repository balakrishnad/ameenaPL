/* eslint-disable react/prop-types */
import React from 'react';
import { i18next } from '../i18n';

export default function (props) {
  
  return (
      <div
      className={ `message-container ${
        props.type === 'warning'
          ? 'message-container_warning'
          : props.type === 'info'
          ? 'message-container_info'
          : 'message-container_danger'
      }` }
    >
          <p className="message-container__text">{i18next.t(props.text)}</p>
      </div>
  );
}
