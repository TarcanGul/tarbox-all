import { toPlayers as mockToPlayers, fromPlayers as mockFromPlayers, getMessageDest as mockRequestToStartDest } from "../../src/games/helpers";
import { PlayerStats, TarboxMessage, TarboxStateHandlers } from "../../src/types";
import { IPublishParams, StompHeaders } from '@stomp/stompjs';
// Arrange, act, assert

describe('Wordfinder Tests', () => {

    const TEST_URL = "http://mockurltest.com";
    const MOCK_GAME_ID = '1111';
    const TEST_WS = new URL("http://testwebsock.com")
    let originalFetch;

    const mockReceivedMessageQueue : IPublishParams[] = [];
    const mockSentMessagesQueue: IPublishParams[] = [];
    let mockMessageCallback: ((message) => void) | undefined;

    const mockListeners : TarboxStateHandlers = {
        onAnswer: jest.fn(),
        onBeginNextRound: jest.fn(),
        onDone: jest.fn(),
        onEnd: jest.fn(),
        onError: jest.fn(),
        onPlayerAdd: jest.fn(),
        onStart: jest.fn()
    };

    beforeAll(() => {
        originalFetch = global.fetch;
    })

    beforeEach(async () => {
        jest.mock('ws', () => ({
            __esModule: true,
            default: jest.fn().mockImplementation(() => {
            }),
            WebSocket: jest.fn().mockImplementation((brokerURL, protocol?) => ({
                send: (message: IPublishParams) => { mockReceivedMessageQueue.push(message) }
            }))
        })); 
        jest.mock('@stomp/stompjs', () => ({
            __esModule: true,
            default: jest.fn().mockImplementation(() => {}),
            Client: jest.fn().mockImplementation((brokerURL) => ({
                activate: jest.fn().mockImplementation((frame) => {}),
                publish: jest.fn().mockImplementation((publishedMessage) => {
                    switch(publishedMessage.destination) {
                        case mockToPlayers(MOCK_GAME_ID):
                        case mockRequestToStartDest(MOCK_GAME_ID):
                            mockSentMessagesQueue.push(publishedMessage);
                            break;
                        case mockFromPlayers(MOCK_GAME_ID):
                            mockReceivedMessageQueue.push(publishedMessage);
                            mockMessageCallback?.(publishedMessage);
                            break;
                        default:
                            // Do nothing.
                    }
                }),
                deactivate: jest.fn().mockImplementation(() => {}),
                subscribe: jest.fn().mockImplementation((dest, cb) => { 
                    if(dest === `/game/${MOCK_GAME_ID}/events/server`) {
                        mockMessageCallback = cb;
                    } 
                })
            }))
        }));

        global.fetch = jest.fn().mockImplementation(async (url: URL, options) => {
            if(!url) {
                return undefined;
            }
            switch(url.toString()) {
                case `${TEST_URL}/api/games`:
                    if(options.method === 'POST') {
                        return { 
                            status: 201,
                            json: () => {
                            return {
                                id : MOCK_GAME_ID
                            }   
                        }};
                    }
                    
                default:
                    return { mocked : true }
            }
        });

        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout');

        mockReceivedMessageQueue.length = 0
        mockSentMessagesQueue.length = 0
    })

    afterEach(() => {
        mockMessageCallback = undefined;
        jest.clearAllMocks();
        jest.clearAllTimers();
    })

    afterAll(() => {
        global.fetch = originalFetch;
    })

    it('Sanity check: Construction', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const w = new Wordfinder();
        expect(w).not.toBeNull();
    })

    it('Create Game Successful', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const w = new Wordfinder();
        jest.spyOn(w, 'setID');
        w.setBaseURL(new URL(TEST_URL));
        const id = await w.createGame();
        expect(id).toEqual(MOCK_GAME_ID);
        expect(w.setID).toHaveBeenCalledTimes(1);
        expect(w.getID()).toEqual(MOCK_GAME_ID);
    })

    it('Game Base URL throws error if not set.', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const w = new Wordfinder();
        expect(() => w.getBaseURL()).toThrow(Error);
        w.setBaseURL(new URL(TEST_URL));
        expect(w.getBaseURL()).toEqual(new URL(TEST_URL)); 
    })

    it('If createGame fetch fails returns error.', async () => {
        global.fetch = jest.fn().mockImplementation(async (url: URL, options) => {
            if(!url) {
                return undefined;
            }
            switch(url.toString()) {
                case `${TEST_URL}/api/games`:
                    if(options.method === 'POST') {
                        return { 
                            status: 400,
                            json: () => {
                            return {
                                error : "Create Game Failed."
                            }   
                        }};
                    }
                    
                default:
                    return { mocked : true }
            }
        })
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const w = new Wordfinder();
        w.setBaseURL(new URL(TEST_URL));
        expect(async () => {
            const id = await w.createGame();
        }).rejects.toEqual("Create Game Failed.");
    })

    it('Websocket request to start sends the right message.', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const w = new Wordfinder();
        w.setBaseURL(new URL(TEST_URL));
        const id = await w.createGame();
        w.setupWSClient(TEST_WS);
        const startCallback = w.getRequestToStartCallback();
        startCallback();
        expect(mockSentMessagesQueue.length).toBe(1);
        const receivedMessage = mockSentMessagesQueue.pop();
        if(!receivedMessage) {
            fail();
        }
        expect(receivedMessage.destination).toBe(mockRequestToStartDest(MOCK_GAME_ID));
    })

    it('Player add message is handled.', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const { Client } = await import('@stomp/stompjs');
        const w = new Wordfinder();
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        const id = await w.createGame();
        const wClient = w.setupWSClient(TEST_WS);
        wClient.onConnect({
            command: "",
            headers: new StompHeaders(),
            isBinaryBody: false,
            body: "",
            binaryBody: new Uint8Array()
        });
        const startCallback = w.getRequestToStartCallback();
        startCallback();

        const addPlayerBody = {
            status: 'P_ADDED',
            player: 'player1'
        }

        const mockPlayerClient = new Client({
            brokerURL: TEST_WS.toString()
        });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: JSON.stringify(addPlayerBody) });
        expect(mockListeners.onPlayerAdd).toHaveBeenCalledWith('player1');
    })

    it('Error message is handled.', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const { Client } = await import('@stomp/stompjs');
        const w = new Wordfinder();
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        await w.createGame();
        const wClient = w.setupWSClient(TEST_WS);
        wClient.onConnect({
            command: "",
            headers: new StompHeaders(),
            isBinaryBody: false,
            body: "",
            binaryBody: new Uint8Array()
        });

        const messageBody = {
            status: 'ERROR',
            message: 'What is life without error?'
        }

        const mockPlayerClient = new Client({
            brokerURL: TEST_WS.toString()
        });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: JSON.stringify(messageBody) });
        expect(mockListeners.onError).toHaveBeenCalledWith('What is life without error?');
    })

    it('Start message is handled.', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const { Client } = await import('@stomp/stompjs');
        const w = new Wordfinder();
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        await w.createGame();
        const wClient = w.setupWSClient(TEST_WS);
        wClient.onConnect({
            command: "",
            headers: new StompHeaders(),
            isBinaryBody: false,
            body: "",
            binaryBody: new Uint8Array()
        });

        const mockPlayerClient = new Client({
            brokerURL: TEST_WS.toString()
        });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player1') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player2') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player3') });
        
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockStartGameMessage() });

        const expectedMap = new Map();
        expectedMap.set('player1', {'points' : 0 })
        expectedMap.set('player2', {'points' : 0 })
        expectedMap.set('player3', {'points' : 0 })

        expect(mockListeners.onStart).toHaveBeenCalledWith(expectedMap);
    })

    it('Done (round end) message is handled.' , async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const { Client } = await import('@stomp/stompjs');
        const w = new Wordfinder();
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        await w.createGame();
        const wClient = w.setupWSClient(TEST_WS);
        wClient.onConnect({
            command: "",
            headers: new StompHeaders(),
            isBinaryBody: false,
            body: "",
            binaryBody: new Uint8Array()
        });

        const mockPlayerClient = new Client({
            brokerURL: TEST_WS.toString()
        });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player1') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player2') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player3') });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockStartGameMessage() });

        // Consume the PICKED message, no need to do anything in this test.
        mockSentMessagesQueue.pop();

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockWordAndPromptSelectedMessage('player1', 'answer', 'prompt') });

        const expectedStatsMap = new Map();
        expectedStatsMap.set('player1', {'points' : 0 });
        expectedStatsMap.set('player2', {'points' : 0 });
        expectedStatsMap.set('player3', {'points' : 0 });

        expect(mockListeners.onDone).toHaveBeenCalledWith('player1', expectedStatsMap);
        expect(mockSentMessagesQueue.length).toBe(1);
        const sentMessage = mockSentMessagesQueue.pop();
        if(!sentMessage || !sentMessage.body) {
            fail();
        }
        const sentMessageJSON = JSON.parse(sentMessage.body);
        expect(sentMessageJSON).toHaveProperty('status', 'QUESTION');
    })

    it('Answer messages are handled.', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const { Client } = await import('@stomp/stompjs');
        const w = new Wordfinder();
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        await w.createGame();
        const wClient = w.setupWSClient(TEST_WS);
        wClient.onConnect({
            command: "",
            headers: new StompHeaders(),
            isBinaryBody: false,
            body: "",
            binaryBody: new Uint8Array()
        });

        const mockPlayerClient = new Client({
            brokerURL: TEST_WS.toString()
        });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player1') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player2') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player3') });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockStartGameMessage() });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockWordAndPromptSelectedMessage('player1', 'answer', 'prompt') });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockPlayerAnswerMessage('player2', 'answer') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockPlayerAnswerMessage('player3', 'answer3') });

        const expectedAnswerMap = new Map();
        expectedAnswerMap.set('player2', 'answer');
        expectedAnswerMap.set('player3', 'answer3');

        const expectedRanking: [string, PlayerStats][] =  [['player2', { points: 50 }], ['player1', {points: 0}], ['player3', {points: 0}]];

        expect(mockListeners.onAnswer).toHaveBeenCalledWith( {
            answers: expectedAnswerMap,
            correctAnswer: 'answer',
            ranking: expectedRanking
        } );
        expect(setTimeout).toHaveBeenCalledTimes(1);
    })

    it('End callback is called with right values.', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const { Client } = await import('@stomp/stompjs');
        const w = new Wordfinder(1);
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        await w.createGame();
        const wClient = w.setupWSClient(TEST_WS);
        wClient.onConnect({
            command: "",
            headers: new StompHeaders(),
            isBinaryBody: false,
            body: "",
            binaryBody: new Uint8Array()
        });
        const mockPlayerClient = new Client({
            brokerURL: TEST_WS.toString()
        });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player1') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player2') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player3') });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockStartGameMessage() });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockWordAndPromptSelectedMessage('player1', 'answer', 'prompt') });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockPlayerAnswerMessage('player2', 'answer') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockPlayerAnswerMessage('player3', 'answer3') });

        jest.runAllTimers(); // Next turn will start.

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockWordAndPromptSelectedMessage('player2', 'answer', 'prompt') });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockPlayerAnswerMessage('player1', 'answer') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockPlayerAnswerMessage('player3', 'answer3') });

        jest.runAllTimers();

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockWordAndPromptSelectedMessage('player3', 'answer', 'prompt') });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockPlayerAnswerMessage('player1', 'answer') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockPlayerAnswerMessage('player2', 'answer') });

        jest.runAllTimers();

        const expectedRanking: [string, PlayerStats][] =  [['player1', { points: 100 }], ['player2', {points: 100}], ['player3', {points: 0}]];

        expect(mockListeners.onEnd).toHaveBeenCalledWith( {
            ranking: expectedRanking
        } );
    });

    it('onNextRound callback is called with right values.', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const { Client } = await import('@stomp/stompjs');
        const w = new Wordfinder(1);
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        await w.createGame();
        const wClient = w.setupWSClient(TEST_WS);
        wClient.onConnect({
            command: "",
            headers: new StompHeaders(),
            isBinaryBody: false,
            body: "",
            binaryBody: new Uint8Array()
        });
        const mockPlayerClient = new Client({
            brokerURL: TEST_WS.toString()
        });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player1') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player2') });
        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockAddPlayerMessage('player3') });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: mockStartGameMessage() });

        const expectedStatsMap = new Map();
        expectedStatsMap.set('player1', {'points' : 0 });
        expectedStatsMap.set('player2', {'points' : 0 });
        expectedStatsMap.set('player3', {'points' : 0 });

        expect(mockListeners.onBeginNextRound).toHaveBeenCalledWith('player1', expectedStatsMap);
    })

    it('wsClient does not connect if gameID is not set.', async () => {
        const { Wordfinder } = await import("../../src/games/Wordfinder");
        const { Client } = await import('@stomp/stompjs');
        const w = new Wordfinder(1);
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
       

        expect(() => {
            const wClient = w.setupWSClient(TEST_WS);
        }).toThrow();
    })

    const mockAddPlayerMessage = (player: string) => JSON.stringify({
        status: 'P_ADDED',
        player: player
    })

    const mockPlayerAnswerMessage = (player: string, answer: string) => JSON.stringify({
        status: 'ANSWER',
        word: answer,
        player: player
    })

    const mockStartGameMessage = () => JSON.stringify({
        status: 'STARTED'
    })

    const mockWordAndPromptSelectedMessage = (player: string, answer: string, prompt: string) => JSON.stringify({
        status: 'DONE',
        gameId: MOCK_GAME_ID,
        player: player,
        word: answer,
        prompt: prompt
    });

});