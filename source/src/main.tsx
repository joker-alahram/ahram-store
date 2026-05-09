import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from '@/App';
import { RuntimeProviders } from '@/core/providers';
import { bootstrapRuntime } from '@/core/bootstrap';
import { useAppStore } from '@/state/useAppStore';
import '@/styles/globals.css';

bootstrapRuntime();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <RuntimeProviders>
      <HashRouter>
        <App />
      </HashRouter>
    </RuntimeProviders>
  </React.StrictMode>,
);

queueMicrotask(() => {
  void useAppStore.getState().initApp();
});
