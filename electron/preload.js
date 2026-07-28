const { contextBridge } = require('electron');

// Expose isElectron flag to renderer — this is the most reliable way
// to detect Electron environment regardless of protocol or webSecurity settings
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('NEXUS Electron Preload initialized — platform:', process.platform);
});
