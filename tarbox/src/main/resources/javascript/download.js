import { notify } from "./util";

document.querySelector('#windows-link').addEventListener('click', async (e) => {
    const download = await fetch('/desktop-dists/Tarbox Desktop Setup 1.0.0.exe');

    if(!download.ok) {
        notify("Download is not successful");
        return;
    }

    const file = await download.blob();

    if(!file) {
        notify("Download is not successful");
        return;
    }

    try {
        executeDownload(file,  "Tarbox-Windows-Installer.dmg");
    }
    catch(e) {
        notify(e);
        return;
    }

    // Sending the event async, no need to wait.
    fetch("/api/app/event/download", {
        method: 'POST',
        body: JSON.stringify( {
            event: 'DOWNLOAD_WINDOWS'
        })
    });
});

document.querySelector('#mac-link').addEventListener('click', async (e) => {
    const download = await fetch('/desktop-dists/Tarbox Desktop-1.0.0-arm64.dmg');

    if(!download.ok) {
        notify("Download is not successful");
        return;
    }

    const file = await download.blob();

    if(!file) {
        notify("Download is not successful");
        return;
    }

    try {
        executeDownload(file,  "Tarbox-Mac-Installer.dmg");
    }
    catch(e) {
        notify(e);
        return;
    }

    // Sending the event async, no need to wait.
    fetch("/api/app/event/download", {
        method: 'POST',
        body: JSON.stringify( {
            event: 'DOWNLOAD_MAC'
        })
    });
})

document.querySelector('#linux-link').addEventListener('click', async (e) => {
    const download = await fetch('/desktop-dists/Tarbox Desktop-1.0.0-arm64.AppImage');

    if(!download.ok) {
        notify("Download is not successful");
        return;
    }

    const file = await download.blob();

    if(!file) {
        notify("Download is not successful");
        return;
    }

    try {
        executeDownload(file,  "Tarbox-Linux-Installer.dmg");
    }
    catch(e) {
        notify(e);
        return;
    }

    // Sending the event async, no need to wait.
    fetch("/api/app/event/download", {
        method: 'POST',
        body: JSON.stringify( {
            event: 'DOWNLOAD_LINUX'
        })
    });
})

/**
 * @param {*} fileBlob Awaited blob
 * @param {*} filename Filename that is going to be set in the client after download.
 */
function executeDownload(fileBlob, filename) {
    const fileLink = URL.createObjectURL(fileBlob);
    const anchor = document.createElement('a');
    anchor.href = fileLink;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(fileLink);
}