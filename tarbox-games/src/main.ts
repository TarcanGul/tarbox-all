import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { readFile } from 'fs/promises';

const MAIN_PAGE : string = path.join(__dirname, '..', 'public', 'index.html');

const createWindow = () => {
    const window = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        width: 1000,
        height: 1000
    });

    window.loadFile(MAIN_PAGE);
}

app.whenReady().then(() => {
    createWindow();
});

ipcMain.handle('load-word-bank', async (event, ...args) => {
    const result = await readFile(path.join(__dirname, 'data/wordfinder', 'basic_word_bank.json'));
    return JSON.parse(result.toString());
})