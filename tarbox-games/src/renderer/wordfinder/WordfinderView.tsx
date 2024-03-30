import React, { ReactElement, useContext, useEffect, useRef, useState } from "react";
import { WordfinderBuilder } from "../games/wordfinder/WordfinderBuilder";
import { PlayerStats, TarboxViewHandler } from "../../types";
import { Text, Spinner, List, ListItem, Heading, Box, Button, useToast, Container, VStack, Center, HStack, Flex, Tooltip, Square, Spacer } from '@chakra-ui/react';
import { PALETTE } from "../../constants";
import { appBackgroundGradient } from "../theme";
import { Wordfinder } from "../games/wordfinder/Wordfinder";
import AppContext from "../AppContext";

interface PointBarProps {
    players: Map<string, PlayerStats>
}

type GameState = {
    page: WordfinderPage,
    gameID: string,
    players: string[],
    error: string,
    playerStatsMap: Map<string, PlayerStats>,
    currentPlayer: string,
    ranking: string[],
    answerMap: Map<string, string>,
    correctAnswer: string
}

enum WordfinderPage {
    InitialView,
    WaitingView,
    WordAndPromptSubmittedView,
    AnsweredView,
    EndedView,
    DisconnectedView
}

/*****  Wordfinder Pages *****/

const WordfinderView = () => {

    const [viewState, setViewState] : [GameState, any] = useState({ 
        page: WordfinderPage.InitialView,
        gameID: '',
        players: [],
        error: '',
        playerStatsMap: new Map<string, PlayerStats>,
        currentPlayer: '',
        ranking: [],
        answerMap: new Map<string, string>(),
        correctAnswer: ''
    });
    const startHandler = useRef(() => {});
    const context = useContext(AppContext);

    const viewHandler = context.viewHandlerProvider.get();
    const websocketURL = context.tarboxWebsocketURL;

    useEffect(() => {
        const gameSetup = async () => {
            const handlers = {
                onError: (message : string) => setViewState({...viewState, error: message}),
                onPlayerAdd: (player: string) => setViewState((prevViewState : GameState) => ({...prevViewState, players: [...prevViewState.players, player]})),
                onDone: (player: string, playerStatsMap: Map<string, PlayerStats>) => {
                    setViewState({...viewState, currentPlayer: player, playerStatsMap: playerStatsMap, page: WordfinderPage.WordAndPromptSubmittedView });
                },
                onAnswer: (answerBody: any) => {
                    setViewState({...viewState, answerMap: answerBody.answers, correctAnswer: answerBody.correctAnswer, ranking: answerBody.ranking, page: WordfinderPage.AnsweredView});
                },
                onEnd: (endBody: any) => {
                    setViewState({...viewState, ranking: endBody.ranking, page: WordfinderPage.EndedView});
                },
                onBeginNextRound: (picker:  string, playerStatsMap: Map<string, PlayerStats>) => {
                    setViewState({...viewState, currentPlayer: picker, page: WordfinderPage.WaitingView, playerStatsMap: playerStatsMap});
                },
                onStart: (players: Map<string, PlayerStats>) => {
                    setViewState((prevViewState : GameState) => ({...prevViewState, playerStatsMap: players}));
                },
                onDisconnect: () => {
                    setTimeout(() => {
                        viewHandler.home?.();
                    }, 3000);
                    setViewState({...viewState, page: WordfinderPage.DisconnectedView});
                }
            };

            const wordfinder : Wordfinder = await new WordfinderBuilder()
                .withStateHandlers(handlers)
                .withWebsocketServer(websocketURL)
                .build();
            startHandler.current = wordfinder.getRequestToStartCallback();
            setViewState({...viewState, gameID: wordfinder.getID()});
        };

        gameSetup();
    }, []);


    switch(viewState.page) {
        case WordfinderPage.InitialView:
            return <InitialView gameID={viewState.gameID} players={viewState.players} error={viewState.error} startHandler={startHandler.current}/>;
        case WordfinderPage.WaitingView:
            return <WaitingView player={viewState.currentPlayer} playerStatsMap={viewState.playerStatsMap}/>
        case WordfinderPage.WordAndPromptSubmittedView:
            return <WordAndPromptSubmittedView player={viewState.currentPlayer} playerStats={viewState.playerStatsMap}/>
        case WordfinderPage.AnsweredView:
            return <AnsweredView ranking={viewState.ranking} answerMap={viewState.answerMap} correctAnswer={viewState.correctAnswer} />;
        case WordfinderPage.EndedView:
            return <EndedView ranking={viewState.ranking} viewHandler={viewHandler}/>
        case WordfinderPage.DisconnectedView:
            return <DisconnectedView />;
            ;
    }
}

const InitialView = ( {gameID, players, error, startHandler} : any ) => {

    const canStart = players.length >= 3;

    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body'>
        <Center w='inherit' h='inherit'>
            <VStack gap='5vh' color='whitesmoke' paddingTop='10vh' w='inherit' h='inherit'>
                {error ? <Error error={error}></Error> : <></>}
                <Heading size='2xl' fontWeight='800' fontStyle='italic'> Wordfinder </Heading>
                <Heading size='xl'> Welcome! </Heading>
                <Flex gap='2vw' alignContent='center' alignItems='center'>
                    <Text fontSize='2xl'> Game code: </Text>
                    <Box borderRadius='20px' border='ButtonText' bgColor={PALETTE.quartery} padding='10px'>
                        <Center>
                            {gameID ? <Text fontSize='2.5rem'> {gameID} </Text> : <Spinner color={PALETTE.primary}/>}
                        </Center>
                    </Box>    
                </Flex>
                <PlayerList players={players}></PlayerList>
                <VStack h='20vh' w='50vw' align='center' justifyContent='center' gap={'5vh'}>
                    <Tooltip label='You need at least 3 players.' isDisabled={canStart} hasArrow>
                        <Button 
                            w='30vw' 
                            bgColor={PALETTE.quartery} 
                            boxShadow='5px 5px 3px' 
                            isDisabled={!canStart} 
                            onClick={startHandler}>
                            Start
                        </Button>
                    </Tooltip>
                </VStack>
            </VStack>
        </Center>
    </Box>
}

const WordAndPromptSubmittedView = ( { player, playerStats } : { player: string, playerStats: Map<string, PlayerStats> } ) => {
    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body' justifyContent='center' alignItems='center'>
        <Center w='inherit' h='80%'>
            <Heading as='h1' fontFamily='body' color='whitesmoke' >{player} has picked the word.</Heading>
        </Center>
        <Flex h='20%' justifyContent='center' alignItems='center'>
            <PointBar players={playerStats}></PointBar>
        </Flex>
    </Box>
}

const AnsweredView = ( {ranking, answerMap, correctAnswer, playerStatsMap} : any ) => {
    const answers : any = [];
    answerMap.forEach((answer : string, player: string) => answers.push(<Heading as='h2' key={player}> {player} answered {answer} </Heading>));

    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body'>
        <Center w='inherit' h='80%'>
            <VStack w='inherit' h='inherit'>
                <Heading as='h1' color='whitesmoke'>Everyone answered!</Heading>
                { answers }
                <Heading as='h1' color='whitesmoke'>Correct answer is {correctAnswer}.</Heading>
                {ranking.map((playerEntry: [string, any], i : number) => {
                    return <Box key={i}>
                        <Heading as='h2' color='whitesmoke'> {i+1}. {playerEntry[0]} </Heading>
                        <Heading as='h3' color='whitesmoke'> Points: {playerEntry[1].points} </Heading>
                    </Box>
                })}
                <Heading as='h3' color='whitesmoke'>Next round is starting soon...</Heading>
            </VStack>
        </Center>
    </Box>
}

const EndedView = ( {ranking, viewHandler} : any ) => {
    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body'>
        <Center w='inherit' h='inherit' paddingTop='10vh'>
            <VStack w='inherit' h='inherit'>
                {ranking.map((playerEntry: [string, any], i : number) => {
                    return <Box key={i}>
                        <Heading as='h2' color='whitesmoke'> {i+1}. {playerEntry[0]} </Heading>
                        <Heading as='h3' color='whitesmoke'> Points: {playerEntry[1].points} </Heading>
                    </Box>
                })}
                <Heading as='h2' color='whitesmoke'> Congratulations! </Heading>
                <Button w='30vw' bgColor={PALETTE.quartery} boxShadow='5px 5px 3px' onClick={viewHandler.home}> Back To Menu </Button>
            </VStack>
        </Center>
    </Box>
}

const WaitingView = ( {player, playerStatsMap} : any ) => {
    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body'>
        <Center w='inherit' h='80%'>
            <Heading as='h1' color='whitesmoke'>Waiting for {player} to pick a word...</Heading>
        </Center>
        <Flex h='20%' justifyContent='center' alignItems='center'>
            <PointBar players={playerStatsMap}></PointBar>
        </Flex>
    </Box> 
}

const DisconnectedView = () => {
    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body'>
        <Center w='inherit' h='80%'>
            <Heading as='h1' color='whitesmoke'>Disconnected. Going back to home menu.</Heading>
        </Center>
    </Box>  
}

/*****  Helper Components *****/

const PointBar = ( { players } : PointBarProps ) => {
    return <HStack spacing={20} fontFamily='body'>
        {Array.from(players.entries()).map(([player, stats], index) => 
        <VStack width='90%' key={index}>
            <Center bgColor={PALETTE.tertiary} color='whitesmoke' height='4rem' width='20ch'>
                <Text>{player}</Text>
            </Center>
            <Square border={1} borderColor={PALETTE.tertiary} color='whitesmoke' size='4rem'>
                <Text>{stats?.points}</Text>
            </Square>
        </VStack>    
    )}
     </HStack>
}

const PlayerList = ( {players} : {players: string[]} ) => {

    if(players.length === 0) {
        return <Box borderRadius='20px' border='ButtonText' bgColor='orange.300' padding='10px'>
            Joined players will appear here!
        </Box>
    }

    return <Flex fontFamily='body' columnGap='2'>
            { players.map((player : string, index : number) => 
                <Text display='inline'
                    borderRadius='20px' 
                    border='ButtonText' 
                    bgColor={PALETTE.quartery} 
                    padding='10px'
                    key={index}>{player}</Text>) 
                }
        </Flex>
}

const Error = ( {errorMessage} : any ) => {
    const error = useToast();
    return error({
        title: errorMessage,
        description: errorMessage,
        status: 'error',
        duration: 3000,
    });
}

const Timeout = ( {children, time} : any ) => {
    React.Children.forEach(children, (child) => {
        setTimeout( () => <></>, time);
    })
    return <Box>{children}</Box>;
}

export default WordfinderView;