/* eslint-disable react/prop-types */
import React from 'react';
import { i18next } from '../i18n';

export default function (props) {
  return (
      <div className="pep-legend">
          <ul className="legend-list">
              {props.items &&
          props.items.map((item, index) => {
            return (    
                <li className="legend-list__item" key={ item.color }>
                    <div
                  className="legend-list__marker"
                  style={ { backgroundColor: item.color } }
                />
                    {i18next.t(item.title)}
                </li>
            );
          })}
          </ul>
      </div>
  );
}
