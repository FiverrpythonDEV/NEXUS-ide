const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'NEXUS',
    backgroundColor: '#0B0A12',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => win.show());

  if (app.isPackaged) {
    const possiblePaths = [
      path.join(app.getAppPath(), 'dist', 'index.html'),
      path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
      path.join(__dirname, '..', 'dist', 'index.html'),
    ];

    const indexPath = possiblePaths.find(p => fs.existsSync(p));

    if (indexPath) {
      win.loadFile(indexPath);
    } else {
      win.loadURL(`data:text/html,<body style="background:#0B0A12;color:#A855F7;font-family:monospace;padding:40px">
        <h2>NEXUS — path error</h2>
        <p>Checked:</p>
        <ul>${possiblePaths.map(p => `<li>${p} — ${fs.existsSync(p) ? '✓' : '✗'}</li>`).join('')}</ul>
        <p>appPath: ${app.getAppPath()}</p>
        <p>resourcesPath: ${process.resourcesPath}</p>
        <p>__dirname: ${__dirname}</p>
      </body>`);
    }
  } else {
    win.loadURL('http://localhost:3000').catch(() => {
      win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
    });
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
