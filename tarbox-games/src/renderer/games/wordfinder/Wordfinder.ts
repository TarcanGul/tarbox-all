import { Client } from '@stomp/stompjs';
import Websocket from 'ws';
import { PlayerStats, GameUpdateFunction, GameOptions, TarboxMessage, TarboxStateHandlers } from '../../../types';
import { getMessageDest, toPlayers, fromPlayers } from '../../helpers';

Object.assign(globalThis, { Websocket });

const URL_ERROR = "Base URL is not set.";
const GAME_INIT_ERROR = "Game ID is not initialized while creating the WS client.";

export class Wordfinder {
    private isActive: boolean;

    private wsClient: Client | undefined;
    private currentAnswer: string;
    private currentPickedIndex = 0;
    private currentRound = 1;
    private gameID: string;
    private players: Map<string, PlayerStats>;
    private answerMap: Map<string, string>;
    private currentPicker = '';
    private baseUrl: URL | undefined;
    private numOfRounds: number;

    private wordBank: string[] = [];

    private playerList : string[] = []; // For easier tracking

    private DEFAULT_NUM_OF_ROUNDS = 3;

    // Callbacks
    private onError : (message : string) => void = () => undefined;
    private onPlayerAdd : ( player : string ) => void = () => undefined;
    private onDone : (currentPlayer: string, stats: Map<string, PlayerStats>) => void = () => undefined;
    private onAnswer : (body : any) => void = () => undefined;
    private onEnd : (body : any) => void = () => undefined;
    private onBeginNextRound : (picker: string, stats: Map<string, PlayerStats>) => void = () => undefined;
    private onStart : (players: Map<string, PlayerStats>) => void = () => undefined;

    constructor(numOfRounds?: number) {
        // State
        this.currentAnswer = '';
        this.gameID = '';
        this.players = new Map<string, PlayerStats>();
        this.answerMap = new Map<string, string>();
        this.isActive = true;
        this.numOfRounds = numOfRounds || this.DEFAULT_NUM_OF_ROUNDS;

        this.handleGameUpdates = this.handleGameUpdates.bind(this);
    }

    public setID(id: string) {
        this.gameID = id;
    }

    public getID() {
        return this.gameID;
    }

    public setBaseURL(url: URL) {
        this.baseUrl = url;
    }

    public getBaseURL() {
        if(!this.baseUrl) {
            throw new Error(URL_ERROR);
        }
        return this.baseUrl;
    }

    public loadWordBank(wordBank: string[]) : void {
        this.wordBank = wordBank;
    }

    public setListeners(listeners: TarboxStateHandlers) {
        this.onError = listeners.onError;
        this.onPlayerAdd = listeners.onPlayerAdd;
        this.onDone = listeners.onDone;
        this.onAnswer = listeners.onAnswer;
        this.onEnd = listeners.onEnd;
        this.onBeginNextRound = listeners.onBeginNextRound;
        this.onStart = listeners.onStart;
    }

    public async createGame() : Promise<string> {

        const createGameBody = {
            type : 'WORD_FINDER'
        }
        
        const createGameResponse = await fetch(new URL("api/games", this.getBaseURL()), {
            method: 'POST',
            body: JSON.stringify(createGameBody),
            headers: {
                'Content-Type' : 'application/json'
            }
        });

        const createGameResponseJSON = await createGameResponse.json();

        if(createGameResponse.status !== 201) {
            return Promise.reject(createGameResponseJSON['error']);
        }

        const gameID : string = createGameResponseJSON['id'];
        this.setID(gameID);
        return gameID;
    }

    private getPlayers() : string[] {
        return Array.from(this.players.keys());   
    }

    public setupWSClient(brokerURL: URL) : Client {

        if(!this.gameID) {
            throw new Error(GAME_INIT_ERROR);
        }

        const wsClient = new Client({
            brokerURL: brokerURL.toString()
        });

        wsClient.onConnect = (frame: any) => {
            wsClient.subscribe(fromPlayers(this.gameID), this.handleGameUpdates);
        };

        wsClient.onDisconnect = (frame: any) => {
            console.log('disconnected');
            wsClient.unsubscribe(fromPlayers(this.gameID));
        }

        wsClient.onWebSocketError = (error : string) => {
            console.error('Error with websocket', error);
        };
    
        wsClient.onStompError = (frame : any) => {
            console.error('Broker reported error ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        }

        wsClient.activate();
        this.wsClient = wsClient;
        return this.wsClient;
    }

    private async handleGameUpdates(message : TarboxMessage) {

        let messageJSON = JSON.parse(message.body);

        // Do something based on different messages
        switch(messageJSON.status) {
            case 'ERROR':
                this.onError?.(messageJSON.message);
                break;
            case 'P_ADDED':
                this.validateMessage(messageJSON, ['player']);
                const newPlayer : string = messageJSON.player;

                if(!this.playerExists(newPlayer)) {
                    this.addPlayer(newPlayer);
                    this.onPlayerAdd?.(newPlayer);
                }
                break;
            case 'STARTED':
                this.runGame();
                break;
            case 'DONE':
                this.validateMessage(messageJSON, ['player', 'word', 'gameId', 'prompt'])

                const notifyPlayerPicked = {
                    gameId: messageJSON.gameId,
                    player: messageJSON.player,
                    prompt: messageJSON.prompt,
                    status: 'QUESTION',
                    time: Date.now()
                }

                this.publishMessageToPlayers(notifyPlayerPicked);

                this.onDone?.(messageJSON.player, this.getAllPlayerStats());

                break;
            case 'ANSWER':
                this.validateMessage(messageJSON, ['player', 'word']);

                this.registerAnswer(messageJSON.player, messageJSON.word);

                if(this.everyoneAnswered()) {
                    this.processAnswers();

                    this.onAnswer?.( {
                        answers: this.getAllAnswers(),
                        correctAnswer: this.getCorrectAnswer(),
                        ranking: this.getRankingForRound()
                    } );

                    setTimeout(() => this.nextRound(), 5000);
                }

                break;
            default:
                break;
        }
    }

    public getRequestToStartCallback() {
        return () => {
            this.wsClient?.publish({
                destination: `${getMessageDest(this.gameID)}`,
                body: JSON.stringify({
                    'gameType': "WORD_FINDER",
                    "gameId" : this.gameID,
                    "message" : "Game is starting.",
                    "status" : "STARTED",
                    "time": Date.now()
                })
            });
        }
    }

    // The starter method for the game. Should setup the picker queue and start first round. 
    private async runGame() {
        if(!this.gameID) {
            throw new Error('game ID is not set');
        }

        this.playerList = this.getPlayers();

        this.onStart?.(this.players);

        // Start first round.
        this.startRound();
    }

    private startRound() {
        // Reset game state.
        this.answerMap = new Map<string, string>;
        this.currentAnswer = '';
        this.currentPicker = '';

        if(this.currentPickedIndex >= this.playerList.length) {
            if(this.currentRound >= this.numOfRounds) {
                // The game has ended.

                const gameEndedMessage = {
                    status: 'ENDED',
                    gameId: this.gameID,
                    time: Date.now()
                }
                this.publishMessageToPlayers(gameEndedMessage);

                this.onEnd?.({
                    ranking: this.getRankingForRound()
                });

                // Disconnect everyone. End the game.
                this.wsClient?.deactivate();
                this.endGame();

                return;
            }
            else {
                this.currentRound++;
                this.currentPickedIndex = this.currentPickedIndex % this.playerList.length;
            }
        }


        const currentPicker = this.playerList[this.currentPickedIndex];
        const currentWord = this.getNextWordForRound();
        const pickedPlayerMessage = {
            status: 'PICKED',
            gameId: this.gameID,
            time: Date.now(),
            player: currentPicker,
            word: currentWord,
            message: `${currentPicker} is picked.`
        }
    
        this.publishMessageToPlayers(pickedPlayerMessage);

        this.currentPicker = currentPicker;
        this.setCurrentAnswer(currentWord);
        this.onBeginNextRound?.(this.currentPicker, this.getAllPlayerStats());
    }
    
    private getNextWordForRound() {
        if(this.wordBank.length === 0) {
            throw new Error('Load bank is not loaded.');
        }
        const randomNum = Math.floor(Math.random() * this.wordBank.length);
        return this.wordBank[randomNum];
    }

    // min and max are integers
    private getRandomInt(min: number, max: number) {

    }

    private playerExists(player: string) : Boolean {
        return this.players?.has(player);
    }

    /**
     * This function is for just setting up the PlayerStats in the game. 
     * The player should already have added in the backend.
     * @param player The player name that should have been added.
     */
    private addPlayer(player: string) : Boolean {
        this.players.set(player, {
            points: 0
        });

        return true;
    }

    private publishMessageToPlayers(message: any) : Boolean {
        if(!this.wsClient) {
            console.warn("ws client was not initated.");
            return false;
        }
        // Validate game ID
        this.wsClient.publish({
            destination: toPlayers(this.gameID),
            body: JSON.stringify(message)
        });

        return true;
    }

    private setCurrentAnswer(answer: string) : void {
        this.currentAnswer = answer;
    }

    private registerAnswer(player: string, answer: string) {
        if(player !== this.currentPicker && !this.answerMap.has(player)) {
            this.answerMap.set(player, answer);
        }
    }

    private everyoneAnswered() : boolean {
        return this.answerMap.size != 0 && this.answerMap.size === this.playerList.length - 1 && !this.answerMap.has(this.currentPicker);
    }

    private nextRound() : void {
        this.currentPickedIndex++;
        this.startRound();
    }

    private processAnswers() {
        if(!this.everyoneAnswered()) {
            return;
        }

        for(const [player, answer] of this.answerMap) {
            let playerAnswer = answer?.trim().toLowerCase();
            let currentAnswer = this.currentAnswer.trim().toLowerCase();
            if(playerAnswer === currentAnswer) {
                let playerStats : PlayerStats = this.players.get(player) as PlayerStats;
                let pickerPlayerStats: PlayerStats = this.players.get(this.currentPicker) as PlayerStats;

                playerStats.points += 50;
                pickerPlayerStats.points += 20;

                this.players.set(player, playerStats);     
            }
        }   
    }

    private getAllPlayerStats() : Map<string, PlayerStats> {
        return this.players;
    }

    private getCorrectAnswer() : string {
        return this.currentAnswer;
    }

    private getAllAnswers() : Map<string, string> {
        return this.answerMap;
    }

    private getRankingForRound() : [string, PlayerStats][] {
        const ranking = Array.from(this.players.entries()).sort((playerEntry, otherPlayerEntry) => {
            const playerScore = playerEntry[1].points;
            const otherPlayerScore = otherPlayerEntry[1].points;
            const playerName = playerEntry[0];
            const otherPlayerName = otherPlayerEntry[0];
            return playerScore != otherPlayerScore ? otherPlayerScore - playerScore : playerName.localeCompare(otherPlayerName)
        });
        return ranking;
    }

    private async endGame() : Promise<void> {
        const res = await fetch(`${this.getBaseURL()}/api/games/${this.gameID}`, {
            method: 'PUT',
            body: JSON.stringify({
                operation: "END"
            }),
            headers: {
                'Content-Type' : 'application/json'
            }
        });

        if(res.ok) {
            this.isActive = false;
        }
    }

    private validateMessage(obj: object, requiredProps: string[]) : void {
        for(const prop of requiredProps) {
            if(!Object.keys(obj).includes(prop)) {
                throw new Error(`${prop} is not provided from the client.`);
            }
        }
    }
}
