const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

// Prevent multiple instances for deep linking
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  // Register the nudge:// protocol
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('nudge', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('nudge');
  }

  const IS_DEV = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  const BASE_URL = IS_DEV ? 'http://localhost:3000' : 'https://nudgemanager.vercel.app';
  const APP_URL = `${BASE_URL}/sign-in`;

  let mainWindow;

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: path.join(__dirname, 'build', 'icon.png'),
      autoHideMenuBar: true, // Hides the classic 'File, Edit, View' menu automatically
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
      },
    });

    // ALWAYS open OAuth and external links in the user's Chrome/system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.includes('supabase.co') || url.includes('google.com') || url.includes('github.com')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      if (url.startsWith(BASE_URL)) return { action: 'allow' };

      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Also prevent in-app navigation to OAuth URLs
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (url.includes('supabase.co') || url.includes('google.com') || url.includes('github.com')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    });

    mainWindow.loadURL(APP_URL);

    // Zoom OUT by setting the factor to a decimal lower than 1.0 (e.g. 0.85 = 85% scale)
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.setZoomFactor(0.85);
    });

    if (IS_DEV) {
      // mainWindow.webContents.openDevTools();
    }
  }

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  // Windows & Linux Deep Linking
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const url = commandLine.pop();
    if (url && url.startsWith('nudge://')) {
      handleDeepLink(url);
    }
  });

  // macOS Deep Linking
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    handleDeepLink(url);
  });

  function handleDeepLink(url) {
    // Expected URL: nudge://auth/callback#access_token=... or ?code=...
    if (url.startsWith('nudge://auth/callback')) {
      // Translate it back to the active Next.js frontend route so it securely sets the cookie inside Electron
      const translatedUrl = url.replace('nudge://auth/callback', `${BASE_URL}/auth/callback`);
      if (mainWindow) {
        mainWindow.loadURL(translatedUrl);
      }
    }
  }

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
