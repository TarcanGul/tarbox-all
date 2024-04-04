class ErrorView extends HTMLElement {
    constructor() {
        super();
    }

    #message;
    #details;

    connectedCallback() {
        const messageDisplay = document.createElement('h2');
        const detailDisplay = document.createElement('p');

        if(this.#message) {
            messageDisplay.textContent = this.#message;
        }

        if(this.#details) {
            detailDisplay.textContent = this.#details;
        }

        this.appendChild(messageDisplay);
        this.appendChild(detailDisplay);
    }

    set message(message) {
        this.#message = message;
    }

    get message() {
        return this.#message;
    }

    set details(details) {
        this.#details = details;
    }

    get details() {
        return this.#details;
    }
}

export default ErrorView;

customElements.define('error-view', ErrorView);