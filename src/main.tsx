import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import { themeStorage, applyTheme } from './utils/theme';
import { initializeApi } from './api/config';
import { getBrowserRouterBasename, shouldUseHashRouter } from './utils/navigation-env';
import './index.css';

initializeApi();

const savedTheme = themeStorage.get();
applyTheme(savedTheme);

const basenameRaw = getBrowserRouterBasename();
const basename = basenameRaw === '/' ? undefined : basenameRaw;
const useHash = shouldUseHashRouter();
const Router = useHash ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router {...(useHash ? {} : { basename })}>
      <App />
    </Router>
  </React.StrictMode>
);
