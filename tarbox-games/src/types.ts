export enum AppPage {
    Home = 'home',
    Wordfinder = 'wordfinder',
    NotFound = 'not-found'
};

export type TarboxViewHandler = {
    [ key in AppPage ] ?: () => void
}

export type PlayerStats = {
    points: number
}

export type State = {
    gameID: string | undefined,
    players: Map<string, PlayerStats>;
    answered: { [player: string] : string};
    pickerQueue: string[];
}

export type GameUpdateFunction = {
    (input: TarboxMessage, options: {}) : void;
}

export type GameOptions = {
    [key: string] : any;
}

export type TarboxMessage = {
    body: string
    status?: 'P_ADDED' | 'ERROR'
}

export type TarboxStateHandlers = {
    onError: (...args: any) => void,
    onPlayerAdd: (...args: any) => void,
    onDone: (...args: any) => void;
    onAnswer: (...args: any) => void;
    onEnd: (...args: any) => void;
    onBeginNextRound: (...args: any) => void;
    onStart: (...args:any) => void;
}
