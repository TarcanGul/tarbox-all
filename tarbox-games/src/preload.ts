 import {IpcRendererEvent, contextBridge, ipcRenderer} from 'electron';
 import {app} from 'electron';

 contextBridge.exposeInMainWorld('electron', {
    tarboxRemoteProcedures : {
        loadWordBank: (type: string): Promise<string[]> => ipcRenderer.invoke('load-word-bank', type),
        onQuit: (cb: (e: IpcRendererEvent, ...args: any) => void): void => {
            ipcRenderer.removeAllListeners('quit');
            ipcRenderer.once('quit', cb)
        } ,
        cleanupComplete: (): Promise<void> => ipcRenderer.invoke('cleanup-complete'),
        getVersion: () => app.getVersion()
    }
 })