const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'NEXUS',
    backgroundColor: '#0B0A12',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // needed for local file:// loading in packaged app
      preload: path.join(__dirname, 'preload.js')
    },
  });

  win.setMenuBarVisibility(false);

  if (app.isPackaged) {
    // In packaged AppImage/deb, use app.getAppPath() which correctly
    // resolves to the root of the packaged app (where dist/ lives)
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    win.loadFile(indexPath).catch((err) => {
      console.error('Failed to load index.html:', err);
      // Fallback: try relative to __dirname
      win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
  } else {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
    win.loadURL(devUrl).catch(() => {
      win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
    });
  }

  // Open DevTools only in dev mode
  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
