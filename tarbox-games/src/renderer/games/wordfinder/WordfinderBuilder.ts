import { TarboxStateHandlers } from "../../../types";
import tarboxAppConfig from "../../config";
import { Wordfinder } from "./Wordfinder";


export class WordfinderBuilder {
    private gameInstance: Wordfinder | undefined;
    private numOfRounds: number | undefined;

    private listeners: TarboxStateHandlers | undefined = undefined;
    private wsBrokerUrl: URL | undefined = undefined;

    private tarboxServerUrl = tarboxAppConfig.tarboxServerUrl;

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
        const resultBank : string[] = await globalThis.electron.tarboxRemoteProcedures.loadWordBank(type);
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

        try {
            await this.gameInstance.createGame();
        }
        catch(e) {
            return Promise.reject({
                message: "The game cannot be created right now."
            });
        }

        this.gameInstance.setupWSClient(this.wsBrokerUrl);

        const wordBank = await this.loadBank('basic');

        this.gameInstance.loadWordBank(wordBank);

        // @ts-ignore
        globalThis.electron.tarboxRemoteProcedures.onQuit(async (event) => {
            await this.gameInstance!.endGame();

            // @ts-ignore
            globalThis.electron.tarboxRemoteProcedures.cleanupComplete();
        });

        return this.gameInstance;
    }
}