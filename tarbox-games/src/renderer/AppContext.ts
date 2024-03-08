import React from 'react';
import { TarboxViewHandler } from '../types';
import tarboxAppConfig from './config';

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
    ...tarboxAppConfig,
    viewHandlerProvider: new ViewHandlerProvider()
};

const AppContext = React.createContext(config);

export default AppContext;