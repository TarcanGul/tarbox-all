import { app, BrowserWindow } from 'electron';
import path from 'path';
import 'dotenv/config';

const MAIN_PAGE : string = path.join(__dirname, '..', 'public', 'index.html');

const createWindow = () => {
    const window = new BrowserWindow({
        width: 1000,
        height: 1000
    });

    window.loadFile(MAIN_PAGE);
}

app.whenReady().then(() => {
    createWindow();
});