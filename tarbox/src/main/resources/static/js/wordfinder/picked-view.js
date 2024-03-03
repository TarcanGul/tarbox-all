class PickedView extends HTMLElement {
    constructor() {
        super();
    }

    // Attributes
    #formCallback;

    connectedCallback() {

        const pageForm = document.createElement('form');

        const promptArea = document.createElement('div');
        const wordArea = document.createElement('div');
      
        promptArea.className = 'promptArea';
        wordArea.className = 'wordArea';
      
        const promptLabel = document.createElement('label');
        const promptInput = document.createElement('textarea');
        promptInput.name = 'prompt';
        promptInput.required = true;
      
        promptArea.appendChild(promptLabel);
        promptArea.appendChild(promptInput);
      
        const wordLabel = document.createElement('label');
        const wordInput = document.createElement('input');
        wordInput.name = 'word';
        wordInput.type = 'text';
        wordInput.required = true;
      
        wordArea.appendChild(wordLabel);
        wordArea.appendChild(wordInput);
      
        promptLabel.textContent = 'Pick a prompt!';
        wordLabel.textContent = 'Pick a word!';
      
        pageForm.appendChild(promptArea);
        pageForm.appendChild(wordArea);
      
        const pageButton = document.createElement('button');
        pageButton.type = 'submit';
        pageButton.textContent = 'Submit';
        pageButton.classList.add('tarbox-button')
      
        pageForm.appendChild(pageButton);

        console.log(this.#formCallback);
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
}

customElements.define('picked-view', PickedView);