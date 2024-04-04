const EMPTY = "";

const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    NOT_FOUND: 404
}

document.querySelector('.main-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const playerName = document.querySelector('#main-form-name-field').value;
    const gameId = document.querySelector('#main-form-id-field').value;
    
    
    const res = await fetch(`api/games/players`, {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
            player: playerName,
            id: gameId
        })
    });

    if(!res.ok) {
        if(res.status === HTTP_STATUS.FORBIDDEN && res.headers.has("error_type")) {
            const resBody = await res.json();
            notify(resBody.message);
            return;
        }
        if(res.status === HTTP_STATUS.BAD_REQUEST) {
            notify("Game is not found.");
            return;
        }
        notify(`An error occured: ${res.status}: ${res.statusText}`);
        return;
    }

    const resBody = await res.json();

    document.cookie = `tarbox_gameid=${gameId};`;
    document.cookie = `tarbox_username=${playerName};`;
    // register the secret code here from resBody
    console.log(`Secret code is: ${resBody.secretCode}`);
    document.cookie = `tarbox_secret_code=${resBody.secretCode}`;
    window.location.replace(`/game/${gameId}`);    
});


let statusTextIsUp = false;

function notify(text) {
    if(statusTextIsUp) {
        return;
    }
    let statusArea = document.querySelector(".status-text");
    const statusText = document.createElement('h3');
    fadeIn(statusArea);
    statusText.innerText = text;
    statusTextIsUp = true;
    statusArea.appendChild(statusText);
    setTimeout(() => {
        fadeOut(statusArea);
    }, 3000);
}

function fadeIn(element) {
    element.classList.remove('fade-out-animate');
    element.classList.add('fade-in-animate');
}

function fadeOut(element) {
    element.classList.remove('fade-in-animate');
    element.classList.add('fade-out-animate');
}

document.querySelector(".status-text").addEventListener('animationend', (e) => {
    if(e.animationName === 'fadeOut') {
        while(e.target.firstChild) {
            e.target.removeChild(e.target.firstChild);
        }
        statusTextIsUp = false;
    }
});