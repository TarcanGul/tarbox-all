 import {contextBridge, ipcRenderer} from 'electron';

 contextBridge.exposeInMainWorld('electron', {
    tarboxRemoteProcedures : {
        loadWordBank: (type: string): Promise<string[]> => ipcRenderer.invoke('load-word-bank', type)
    }
 })