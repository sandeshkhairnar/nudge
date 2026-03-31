const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs from Node/Electron main process to the Renderer process (Next.js frontend)
// This adds `window.electronAPI` inside Nudge frontend if it needs to know it's in a desktop app.
contextBridge.exposeInMainWorld('electronAPI', {
  // Example IPC channels you might implement later:
  // onNativeNotification: (callback) => ipcRenderer.on('native-notification', (_event, value) => callback(value)),
  // getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
