/* eslint-disable react/prop-types */
import React from 'react';
import { i18next } from '../../i18n';
import { PageTexts } from '../../config';

export default function (props) {
  return (
      <div className="important-instructions pep-lr-15">
          <p className="important-instructions__text">
              <span className="important-instructions__intro">
                  {i18next.t(PageTexts.IMPORTANT_INSTRUCTIONS_INTRO)}:{' '}
              </span>
              {i18next.t(props.text)}
          </p>
      </div>
  );
}
