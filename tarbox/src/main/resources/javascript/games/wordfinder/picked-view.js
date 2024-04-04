export class PickedView extends HTMLElement {
    constructor() {
        super();
    }

    // Attributes
    #formCallback;
    #answerWord;

    connectedCallback() {

        const pageForm = document.createElement('form');

        const promptArea = document.createElement('div');
        const wordArea = document.createElement('div');
      
        promptArea.className = 'promptArea';
        wordArea.className = 'wordArea';

        const wordLabel = document.createElement('label');
        const wordDisplay = document.createElement('p');
        wordDisplay.textContent = this.#answerWord;
      
        wordArea.appendChild(wordLabel);
        wordArea.appendChild(wordDisplay);
      
        const promptLabel = document.createElement('label');
        const promptInput = document.createElement('textarea');
        promptInput.name = 'prompt';
        promptInput.required = true;
      
        promptArea.appendChild(promptLabel);
        promptArea.appendChild(promptInput);
      
        promptLabel.textContent = 'Pick a prompt!';
        wordLabel.textContent = 'The word you are describing is...';

        pageForm.appendChild(wordArea);
        pageForm.appendChild(promptArea);

      
        const pageButton = document.createElement('button');
        pageButton.type = 'submit';
        pageButton.textContent = 'Submit';
        pageButton.classList.add('tarbox-button');
      
        pageForm.appendChild(pageButton);

        if(this.#formCallback) {
            this.#formCallback.bind(this);
        }
        pageForm.addEventListener('submit', this.#formCallback);
        

        this.appendChild(pageForm);
    }

    get formCallback() {
        return this.#formCallback;
    }

    set formCallback(value) {
        this.#formCallback = value;
    }

    set answerWord(value) {
        this.#answerWord = value;
    }
}

export default PickedView;

customElements.define('picked-view', PickedView);