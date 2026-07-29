import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Monaco Editor worker fix for Electron
// Must be set BEFORE any Monaco import or React render
// This runs synchronously before anything else loads
(window as any).MonacoEnvironment = {
  getWorker: function() {
    // Return a minimal inline worker that does nothing
    // This prevents the "blue screen" caused by Monaco trying
    // to load workers via absolute URLs in file:// protocol
    const workerSrc = `
      self.onmessage = function(e) {
        // minimal worker stub
      };
    `;
    const blob = new Blob([workerSrc], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    return new Worker(url);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
