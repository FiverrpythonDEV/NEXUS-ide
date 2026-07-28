import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix Monaco Editor workers for Electron (file:// protocol).
// @monaco-editor/react by default loads workers from CDN which fails
// in packaged Electron apps. This configures it to use blob workers instead.
(self as any).MonacoEnvironment = {
  getWorkerUrl: (_moduleId: string, _label: string) => {
    // Return empty worker — monaco-editor/react will handle the rest
    return '';
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
