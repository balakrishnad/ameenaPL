import React from 'react';
import Login from './Login';
import { i18next } from '../../i18n';

export default function () {
  return (
      <div className="row">
          <div className="col-lg-6 col-md-6 mx-auto">
              <div className="panel panel-primary login-container card">
                  <div className="panel-heading card-header">{i18next.t('Login')}</div>
                  <div className="panel-body card-body">
                      <Login />
                  </div>
              </div>
          </div>
      </div>
  );
}
