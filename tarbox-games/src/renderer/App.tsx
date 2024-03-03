import '@fontsource/press-start-2p';
import '@fontsource-variable/outfit';

import React, { useState, lazy, Suspense, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from "@chakra-ui/react";

import Home from './home/Home';
import { AppPage, TarboxViewHandler } from '../types';
import theme from './theme';
import AppContext from './AppContext';

const WordfinderView = lazy(() => import('./wordfinder/WordfinderView'));

const App = () => {

    const [page, setPage] = useState(AppPage.Home);

    const viewHandler : TarboxViewHandler = {
        home: () => setPage(AppPage.Home),
        wordfinder: () => setPage(AppPage.Wordfinder)
    }

    const context = useContext(AppContext);
    context.viewHandlerProvider.set(viewHandler);
    
    switch(page) {
        case AppPage.Home:
            return <Home />;
        case AppPage.Wordfinder:
            return <Suspense fallback={ <h1> Loading... </h1>}>
                <WordfinderView />
            </Suspense> ;
        default:
            return <h1> No page is defined. </h1>
    }
}

const ChakraApp = () => {
    return <ChakraProvider theme={theme}><App /></ChakraProvider>
}

const node = document.getElementById('app') as HTMLElement;
const root = createRoot(node);
root.render(<ChakraApp />);