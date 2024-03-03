class EndedView extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const uiMessage = document.createElement('h2');
        const redirectMessageText = document.createElement('p');

        if(this.message) {
            uiMessage.textContent = this.message;
        }

        if(this.redirectMessage) {
            redirectMessageText.textContent = this.redirectMessage;
        }

        this.appendChild(uiMessage);
        this.appendChild(redirectMessageText);
    }

    set message(value) {
        this.setAttribute('message', value);
    }

    get message() {
        return this.getAttribute('message');
    }

    set redirectMessage(value) {
        this.setAttribute('redirectMessage', value);
    }

    get redirectMessage() {
        return this.getAttribute('redirectMessage');
    }
}

customElements.define('ended-view', EndedView);