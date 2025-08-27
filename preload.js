const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Configurações
    getSettings: () => ipcRenderer.invoke('get-settings'),
    updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
    
    // Eventos do menu
    onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
    onThemeChanged: (callback) => ipcRenderer.on('theme-changed', callback),
    
    // Informações do sistema
    platform: process.platform,
    version: process.versions.electron,
    
    // Remover listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});