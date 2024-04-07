let statusTextIsUp = false;

export function notify(text) {
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