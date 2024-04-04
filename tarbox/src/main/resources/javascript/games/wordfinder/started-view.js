class StartedView extends HTMLElement {

    constructor() {
        super();
    }

    async connectedCallback() {
        const page = document.createElement("div");

        const message = document.createElement("h2");
        message.textContent = "Host have started the game!";

        const gameId = this.gameId;

        if(!gameId) {
            throw new Error('Game id is not set');
        }

        const players = await this.#getPlayers(gameId);
      
        page.appendChild(message);
        page.appendChild(players);

        this.appendChild(page);
    }

    async #getPlayers(gameId) {
        const otherPlayersResponse = await fetch(`/api/games/${gameId}/players`);
        const otherPlayers = await otherPlayersResponse.json();
      
        const otherPlayersElement = document.createElement("h2");
      
        for (let i = 0; i < otherPlayers.length; i++ ) {
          otherPlayersElement.textContent += otherPlayers[i];
          otherPlayersElement.textContent += " *** ";
        }

        return otherPlayersElement;
    }

    get gameId() {
        return this.getAttribute('game-id');
    }

    set gameId(value) {
        this.setAttribute('game-id', value);
    }
}

customElements.define('started-view', StartedView);