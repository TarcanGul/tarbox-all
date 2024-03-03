import { TarboxStateHandlers } from '../../../src/types';



describe('Wordfinder Builder Tests', () => {
    
    const mockHandlers : TarboxStateHandlers = {
        onAnswer: jest.fn(),
        onBeginNextRound: jest.fn(),
        onDone: jest.fn(),
        onEnd: jest.fn(),
        onError: jest.fn(),
        onPlayerAdd: jest.fn(),
        onStart: jest.fn()
    };

    const mockWSServer = new URL("http://randomwebsockettest.com");

    jest.mock('../../../src/games/Wordfinder', () => ({
        Wordfinder: jest.fn().mockImplementation(() => ({
            setListeners: jest.fn().mockImplementation((handlers) => {}),
            createGame: jest.fn().mockResolvedValue('1111'),
            setupWSClient: jest.fn(),
            setBaseURL: jest.fn(),
            setID: jest.fn(),
            getID: jest.fn().mockImplementation(() => '1111')
        }))
    }));

    afterEach(() => {
        jest.resetAllMocks();
    })

    it('Happy path', async () => {
        const {WordfinderBuilder} = await import('../../../src/games/builders/WordfinderBuilder');
        const wordfinder = await new WordfinderBuilder()
            .withWebsocketServer(mockWSServer)
            .withStateHandlers(mockHandlers)
            .withNumberOfRounds(5)
            .build();
        expect(wordfinder).not.toBeNull();
        expect(wordfinder.getID()).toEqual('1111');
    });

    it('Does not create instance if handler is not passed.', async () => {
        const {WordfinderBuilder} = await import('../../../src/games/builders/WordfinderBuilder');
        expect(async () => {await new WordfinderBuilder().withWebsocketServer(mockWSServer).build()}).rejects.toThrow();
    });

    it('Does not create instance if websocket server is not provided.' ,async () => {
        const {WordfinderBuilder} = await import('../../../src/games/builders/WordfinderBuilder');
        expect(async () => {await new WordfinderBuilder().withStateHandlers(mockHandlers).build()}).rejects.toThrow(Error);
    })

    it('Does not accept 0 or negative number for number of rounds.', async () => {
        const {WordfinderBuilder} = await import('../../../src/games/builders/WordfinderBuilder');
        expect(async () => {
            const wordfinder = await new WordfinderBuilder()
            .withNumberOfRounds(0)
            .build();
        }).rejects.toThrow();

        expect(async () => {
            const wordfinder = await new WordfinderBuilder()
            .withNumberOfRounds(-2)
            .build();
        }).rejects.toThrow();
    })
});