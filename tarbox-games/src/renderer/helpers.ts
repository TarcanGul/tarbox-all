export const getMessageDest = (gameID: string) => `/app/game/${gameID}/events/run`;
export const toPlayers = (gameID: string) => `/game/${gameID}/actions`;
export const fromPlayers = (gameID: string) => `/game/${gameID}/events/server`; 