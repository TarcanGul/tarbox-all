import { Wordfinder } from "../../src/renderer/games/wordfinder/Wordfinder";
import { toPlayers as mockToPlayers, fromPlayers as mockFromPlayers, getMessageDest as mockRequestToStartDest } from "../../src/renderer/helpers";
import { PlayerStats, TarboxMessage, TarboxStateHandlers } from "../../src/types";
import { IPublishParams, StompHeaders } from '@stomp/stompjs';

describe('Wordfinder Tests', () => {

    const TEST_URL = "http://mockurltest.com";
    const MOCK_GAME_ID = '1111';
    const TEST_WS = new URL("http://testwebsock.com");
    const MOCK_SECRET_CODE = "SECRET_CODE";
    let originalFetch;

    const mockReceivedMessageQueue : IPublishParams[] = [];
    const mockSentMessagesQueue: IPublishParams[] = [];
    const mockWordBank: string[] = ['answer'];
    let mockMessageCallback: ((message) => void) | undefined;
    let createWordfinderInstance: () => Wordfinder;
    let createWordfinderInstanceWithRounds: (numOfRounds: number) => Wordfinder;
 
    const mockListeners : TarboxStateHandlers = {
        onAnswer: jest.fn(),
        onBeginNextRound: jest.fn(),
        onDone: jest.fn(),
        onEnd: jest.fn(),
        onError: jest.fn(),
        onPlayerAdd: jest.fn(),
        onStart: jest.fn(),
        onDisconnect: jest.fn()
    };

    beforeAll(() => {
        originalFetch = global.fetch;
    })

    beforeEach(async () => {

        setupMocks();
        clearMockMessageQueues();

        const { Wordfinder } = await import("../../src/renderer/games/wordfinder/Wordfinder");
        createWordfinderInstance = () => {
            return new Wordfinder();
        }

        createWordfinderInstanceWithRounds = (numOfRounds: number) => {
            return new Wordfinder(numOfRounds);
        }
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
        const w = createWordfinderInstance();
        w.loadWordBank(mockWordBank);
        expect(w).not.toBeNull();
    })

    it('Create Game Successful', async () => {
        const w = createWordfinderInstance();
        w.loadWordBank(mockWordBank);
        w.setBaseURL(new URL(TEST_URL));
        await w.createGame();
        expect(w.getID()).toEqual(MOCK_GAME_ID);
    })

    it('Game Base URL throws error if not set.', async () => {
        const w = createWordfinderInstance();
        w.loadWordBank(mockWordBank);
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
        const w = createWordfinderInstance();
        w.loadWordBank(mockWordBank);
        w.setBaseURL(new URL(TEST_URL));
        expect(async () => {
            const id = await w.createGame();
        }).rejects.toEqual("Create Game Failed.");
    })

    it('Websocket request to start sends the right message.', async () => {
        const w = createWordfinderInstance();
        w.loadWordBank(mockWordBank);
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
        const { Client } = await import('@stomp/stompjs');
        const w = createWordfinderInstance();
        w.loadWordBank(mockWordBank);
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

        const mockPlayerClient = new Client({
            brokerURL: TEST_WS.toString()
        });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body:  mockAddPlayerMessage('player1') });
        expect(mockListeners.onPlayerAdd).toHaveBeenCalledWith('player1');
    })

    it('Error message is handled.', async () => {
        const { Client } = await import('@stomp/stompjs');
        const w = createWordfinderInstance();
        w.loadWordBank(mockWordBank);
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
            message: 'What is life without error?',
            secretCode: MOCK_SECRET_CODE
        }

        const mockPlayerClient = new Client({
            brokerURL: TEST_WS.toString()
        });

        mockPlayerClient.publish({destination: `/game/${MOCK_GAME_ID}/events/server`, body: JSON.stringify(messageBody) });
        expect(mockListeners.onError).toHaveBeenCalledWith('What is life without error?');
    })

    it('Start message is handled.', async () => {
        const { Client } = await import('@stomp/stompjs');
        const w = createWordfinderInstance();
        w.loadWordBank(mockWordBank);
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
        const { Client } = await import('@stomp/stompjs');
        const w = createWordfinderInstance();
        w.loadWordBank(mockWordBank);
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
        const { Client } = await import('@stomp/stompjs');
        const w = createWordfinderInstance();
        w.loadWordBank(mockWordBank);
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

        const expectedRanking: [string, PlayerStats][] =  [
            ['player2', { points: 50 }], 
            ['player1', { points: 20 }], 
            ['player3', { points: 0 }]];

        expect(mockListeners.onAnswer).toHaveBeenCalledWith( {
            answers: expectedAnswerMap,
            correctAnswer: 'answer',
            ranking: expectedRanking
        } );
        expect(setTimeout).toHaveBeenCalledTimes(1);
    })

    it('End callback is called with right values.', async () => {
        const w = createWordfinderInstanceWithRounds(1);
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        w.loadWordBank(mockWordBank);
        await w.createGame();
        const { Client } = await import('@stomp/stompjs');
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

        const expectedRanking: [string, PlayerStats][] =  [
            ['player1', { points: 120 }], 
            ['player2', { points: 120 }], 
            ['player3', { points: 40 }]
        ];

        expect(mockListeners.onEnd).toHaveBeenCalledWith( {
            ranking: expectedRanking
        } );
    });

    it('onNextRound callback is called with right values.', async () => {
        const { Client } = await import('@stomp/stompjs');
        const w = createWordfinderInstance();
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        w.loadWordBank(mockWordBank);
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
        const w = createWordfinderInstance();
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        w.loadWordBank(mockWordBank);
       

        expect(() => {
            const wClient = w.setupWSClient(TEST_WS);
        }).toThrow();
    })

    it('onDisconnect is called and redirects to home page.', async () => {
        const w = createWordfinderInstance();
        w.setListeners(mockListeners);
        w.setBaseURL(new URL(TEST_URL));
        w.loadWordBank(mockWordBank);
        const id = await w.createGame();
        const wClient = w.setupWSClient(TEST_WS);

        wClient.onDisconnect({
            command: "",
            headers: new StompHeaders(),
            isBinaryBody: false,
            body: "",
            binaryBody: new Uint8Array()
        });

        expect(mockListeners.onDisconnect).toHaveBeenCalled();
    })

    const mockAddPlayerMessage = (player: string) => JSON.stringify({
        status: 'P_ADDED',
        player: player,
        secretCode: MOCK_SECRET_CODE
    })

    const mockPlayerAnswerMessage = (player: string, answer: string) => JSON.stringify({
        status: 'ANSWER',
        word: answer,
        player: player,
        secretCode: MOCK_SECRET_CODE

    })

    const mockStartGameMessage = () => JSON.stringify({
        status: 'STARTED',
        secretCode: MOCK_SECRET_CODE
    })

    const mockWordAndPromptSelectedMessage = (player: string, answer: string, prompt: string) => JSON.stringify({
        status: 'DONE',
        gameId: MOCK_GAME_ID,
        player: player,
        word: answer,
        prompt: prompt,
        secretCode: MOCK_SECRET_CODE
    });

    function setupMocks() {
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
    
        jest.useFakeTimers();
        jest.spyOn(globalThis, 'setTimeout');
    
    
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
                                id : MOCK_GAME_ID,
                                secretCode: MOCK_SECRET_CODE
                            }   
                        }};
                    }
                    
                default:
                    return { mocked : true }
            }
        });

        globalThis.electron = {
            tarboxRemoteProcedures: {
                loadWordBank: () => ['word', 'bank'],
                onQuit: () => {},
                cleanupComplete: () => {},
                getVersion: () => '1.0.0'
            }
        }
    }

    function clearMockMessageQueues() {
        mockReceivedMessageQueue.length = 0;
        mockSentMessagesQueue.length = 0;
    }

});