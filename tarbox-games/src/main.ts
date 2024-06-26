import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { readFile } from 'fs/promises';

const MAIN_PAGE : string = path.join(__dirname, '..', 'public', 'index.html');

const createWindow = () => {
    const window = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: app.isPackaged ? false : true
        },
        width: 1000,
        height: 1000
    });

    window.webContents.userAgent = `Tarbox/${app.getVersion()}`;

    window.loadFile(MAIN_PAGE);

    window.on('close', (e) => {
        e.preventDefault();
        
        window.webContents.send('quit');
    });

    ipcMain.handle('load-word-bank', async (event, ...args) => {
        if(args.length === 0) {
            return;
        }
        const wordBankType = args[0];
        const result = await readFile(path.join(__dirname, 'data/wordfinder', wordBankType + '_word_bank.json'));
        return JSON.parse(result.toString());
    })

    ipcMain.handle('version', async (event) => {
        return app.getVersion();
    })
    
    ipcMain.handleOnce('cleanup-complete', () => {
        window.destroy();
        app.quit();
    })
}

app.whenReady().then(() => {
    createWindow();
});