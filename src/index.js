/* eslint no-undef: 0 */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import store, { history } from './store';
import { initAuth, Formio } from 'react-formio';
// import FormioOfflineProject from 'formio-plugin-offline';
import App from './App';
import 'typeface-roboto';
import { AppConfig, OfflinePluginConfig } from './config';

import './styles.scss';

Formio.setProjectUrl(AppConfig.projectUrl);
Formio.setBaseUrl(AppConfig.apiUrl);
// Offline plugin initialization
// const offline = FormioOfflineProject.getInstance(
//   AppConfig.projectUrl,
//   AppConfig.projectUrl,
//   OfflinePluginConfig,
// );
// offline.beforeRequest(
//   async (req) => {
//     if (
//       req.type === 'submission' &&
//       req.data.state === 'submitted' &&
//       [ 'POST', 'PUT' ].includes(req.method)
//     ) {
//       const { submissions } = store.getState();
//       const isDateInvalid = submissions.submissions.some(
//         (sub) => sub.data.time && sub.data.time === req.data.data.time
//       );
//       if (!isDateInvalid) {
//         return true;
//       }
//       return {
//         result: new Error(
//           "Record already exists for the selected time slot, request won't be sent"
//         ),
//         options: { delete: true },
//       };
//     }
//     return true;
//   },
//   { fromOffline: true }
// );

// Formio.registerPlugin(offline, 'offline-pepsico');
store.dispatch(initAuth());
// Initialize the current user

render(
    <Provider store={ store }>
        <ConnectedRouter history={ history }>
            <div>
                <App />
            </div>
        </ConnectedRouter>
    </Provider>,
  document.getElementById('root')
);
