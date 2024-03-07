import { TarboxStateHandlers } from "../../../types";
import { Wordfinder } from "./Wordfinder";


export class WordfinderBuilder {
    private gameInstance: Wordfinder | undefined;
    private numOfRounds: number = 3;

    private listeners: TarboxStateHandlers | undefined = undefined;
    private wsBrokerUrl: URL | undefined = undefined;

    private tarboxServerUrl = new URL("http://localhost:8080");

    constructor() {
        this.gameInstance = undefined;
    }

    public withStateHandlers(listeners: TarboxStateHandlers) {
        this.listeners = listeners;
        return this;
    }

    public withWebsocketServer(brokerURL: URL) {
        this.wsBrokerUrl = brokerURL;
        return this;
    }

    public withNumberOfRounds(numOfRounds: number) {
        if(numOfRounds <= 0) {
            throw new Error("Invalid number of rounds.");
        }
        this.numOfRounds = numOfRounds;
        return this;
    }

    private async loadBank(type: string) : Promise<string[]> {
        // @ts-ignore
        const resultBank : string[] = await globalThis.electron.tarboxRemoteProcedures.loadWordBank(type); // Returns list of words.
        return resultBank;
    }

    public async build() : Promise<Wordfinder> {
        if(!this.listeners) {
            throw new Error("No handlers are set for the game object.");
        }

        if(!this.wsBrokerUrl) {
            throw new Error("No websocket server url have been provided.");
        }
        this.gameInstance = new Wordfinder(this.numOfRounds);
        this.gameInstance.setListeners(this.listeners);
        this.gameInstance.setBaseURL(this.tarboxServerUrl);

        let gameID : string = await this.gameInstance.createGame();
        this.gameInstance.setID(gameID);

        this.gameInstance.setupWSClient(this.wsBrokerUrl);

        const wordBank = await this.loadBank('basic');

        this.gameInstance.loadWordBank(wordBank);

        return this.gameInstance;
    }
}