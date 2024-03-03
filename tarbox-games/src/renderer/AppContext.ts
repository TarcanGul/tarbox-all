import React from 'react';
import { TarboxViewHandler } from '../types';

class ViewHandlerProvider {
    private viewHandler : TarboxViewHandler | undefined = undefined;

    get () {
        if(!this.viewHandler) {
            throw new Error("View handler is not initalized.");
        }
        return this.viewHandler;
    }

    set (viewHandler: TarboxViewHandler) {
        this.viewHandler = viewHandler;
    }
}

type TarboxConfig = {
    tarboxWebsocketURL: URL,
    viewHandlerProvider: ViewHandlerProvider,
}

const config : TarboxConfig = {
    tarboxWebsocketURL: new URL("ws://localhost:8080/ws"),
    viewHandlerProvider: new ViewHandlerProvider()
};

const AppContext = React.createContext(config);

export default AppContext;