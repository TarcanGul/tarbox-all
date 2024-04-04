class QuestionView extends HTMLElement {
    constructor() {
        super();
    }

    #formCallback;
    #prompt;

    connectedCallback() {

        const pageForm = document.createElement('form');

        const questionArea = document.createElement('h2');
        questionArea.textContent = this.#prompt;

        const answerArea = document.createElement('input');
        answerArea.type = 'text';
        answerArea.name = 'answer';
        answerArea.required = true;

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Submit';
        submitButton.classList.add('tarbox-button');
        submitButton.classList.add('question-view-button');

        if(this.#formCallback) {
            this.#formCallback.bind(this);
        }
        pageForm.addEventListener('submit', this.#formCallback);

        pageForm.append(questionArea, answerArea, submitButton);
        
        this.appendChild(pageForm);
    }

    get formCallback() {
        return this.#formCallback;
    }

    set formCallback(value) {
        this.#formCallback = value;
    }

    set prompt(value) {
        this.#prompt = value;
    }

    get prompt() {
        return this.#prompt;
    }
}

customElements.define('question-view', QuestionView);