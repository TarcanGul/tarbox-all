class WaitingView extends HTMLElement {

    constructor() {
        super();
    }

    connectedCallback() {
        const uiMessage = document.createElement("h2");

        if(this.message) {
            uiMessage.textContent = this.message;
        }

        this.appendChild(uiMessage);
    }

    set message(value) {
        this.setAttribute('message', value);
    }

    get message() {
        return this.getAttribute('message');
    }
}

customElements.define('waiting-view', WaitingView);