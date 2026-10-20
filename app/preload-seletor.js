'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('seletor', {
  listar: () => ipcRenderer.invoke('seletor:listar'),
  escolher: (id, comSom) => ipcRenderer.send('seletor:escolher', String(id), !!comSom),
  cancelar: () => ipcRenderer.send('seletor:cancelar'),
});
