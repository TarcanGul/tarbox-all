import React, { ReactElement, useContext, useEffect, useRef, useState } from "react";
import { WordfinderBuilder } from "../games/wordfinder/WordfinderBuilder";
import { PlayerStats, TarboxViewHandler } from "../../types";
import { Text, Spinner, List, ListItem, Heading, Box, Button, useToast, Container, VStack, Center, HStack, Flex, Tooltip, Square, Spacer, ScaleFade, useDisclosure, useTimeout, Fade, Slide, SlideFade } from '@chakra-ui/react';
import { DEFAULT_TRANSITION, PALETTE } from "../../constants";
import { appBackgroundGradient } from "../theme";
import { Wordfinder } from "../games/wordfinder/Wordfinder";
import AppContext from "../AppContext";
import { keyframes } from "@chakra-ui/react";
import TransitionForEach from "../components/TransitionForEach";
import BoxedWord from "../components/BoxedWord";

interface PointBarProps {
    players: Map<string, PlayerStats>
}

type GameState = {
    /**
     * Page to navigate.
     */
    page: WordfinderPage,

    /**
     * The gameID of the game.
     */
    gameID: string,

    /**
     * The list of player names
     */
    players: string[],

    /**
     * Updated in case of an error
     */
    error: string,

    /**
     * Maps the various stats to player names.
     * key: name of the player
     * value: @type {PlayerStats}
     */
    playerStatsMap: Map<string, PlayerStats>,

    /**
     * The player that is currently coming up with a prompt.
     */
    currentPlayer: string,

    /**
     * The ranking of the players in a list and their stats.
     */
    ranking: [string, PlayerStats][],

    /**
     * Maps the given answers in current round to player names.
     * key: name of the player
     * value: answer given by that player
     */
    answerMap: Map<string, string>,

    /**
     * The correct answer for this round.
     */
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
    }
}

const InitialView = ( {gameID, players, error, startHandler} : any ) => {

    const canStart = players.length >= 3;

    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body'>
        <Center w='inherit' h='inherit'>
            <VStack gap='5vh' color='whitesmoke' paddingTop='10vh' w='inherit' h='inherit'>
            <TransitionForEach delay={0.1}>
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
                </TransitionForEach>
            </VStack>
        </Center>
    </Box>
}

const WordAndPromptSubmittedView = ( { player, playerStats } : { player: string, playerStats: Map<string, PlayerStats> } ) => {
    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body' justifyContent='center' alignItems='center'>
        <TransitionForEach>
            <Center w='inherit' h='80vh'>
                <Heading as='h1' fontFamily='body' color='whitesmoke' >{player} has picked the prompt!</Heading>
            </Center>
            <Flex h='20vh' justifyContent='center' alignItems='center'>
                <PointBar players={playerStats}></PointBar>
            </Flex>
        </TransitionForEach>
    </Box>
}

const AnsweredView = ( {ranking, answerMap, correctAnswer, playerStatsMap} : any ) => {

    const answers : any = [];
    answerMap.forEach((answer : string, player: string) => 
        answers.push(
            <Heading as='h2' key={player} color="whitesmoke"> 
                <BoxedWord color={PALETTE.primary}>{player}</BoxedWord> answered <u>{answer}</u> 
            </Heading>));

    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body'>
        <Center>
            <VStack w='inherit' h='100%' gap={10} spacing={2} paddingTop={'5vh'}>
                <TransitionForEach> 
                    <Heading as='h1' color='whitesmoke'>Everyone answered!</Heading>
                    <VStack gap={5} bgColor={PALETTE.box} padding={'1rem'} borderRadius={'1rem'}>
                        { answers }
                    </VStack>
                    <Heading as='h1' color='whitesmoke'>Correct answer is <BoxedWord color={"green"}>{correctAnswer}</BoxedWord></Heading>

                    {ranking.map((playerEntry: [string, PlayerStats], i : number) => {
                        const player = playerEntry[0];
                        const stats = playerEntry[1];
                        return <VStack width='90%' gap={2} height={'10vh'} key={i}>
                            <HStack>
                                <Center bgColor={PALETTE.primary} color='whitesmoke' height='4rem' width='20ch'>
                                    <Text>{player}</Text>
                                </Center>
                                <Square border={1} borderColor={PALETTE.primary} color='whitesmoke' size='4rem'>
                                    <Text>{stats?.points}</Text>
                                </Square>
                            </HStack>
                    </VStack>    
                    })}
                    <Heading as='h3' color='whitesmoke'>Next round is starting soon...</Heading>
                </TransitionForEach>
            </VStack>
        </Center>
    </Box>
}

const EndedView = ( {ranking, viewHandler} : any ) => {

    const float = keyframes`
        0% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
        100% { transform: translateY(0); }
        `;

    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body'>
        <Center>
                <VStack w='inherit' h='100vh' paddingTop='5vh'>
                <TransitionForEach>
                    <Box h="40vh">
                        {ranking.map((playerEntry: [string, PlayerStats], i : number) => {
                            const player = playerEntry[0];
                            const stats = playerEntry[1];
                            return <VStack width='90%' gap={2} height={'10vh'} key={i}>
                                <HStack>
                                    <Center bgColor={PALETTE.primary} color='whitesmoke' height='4rem' width='20ch'>
                                        <Text>{player}</Text>
                                    </Center>
                                    <Square border={1} borderColor={PALETTE.primary} color='whitesmoke' size='4rem'>
                                        <Text>{stats?.points}</Text>
                                    </Square>
                                </HStack>
                        </VStack>    
                        })}
                    </Box>

                    <Heading as='h2' color='whitesmoke' h='20vh' animation={`${float} infinite 3s ease-in-out`}> Congratulations! </Heading>
                    <Button w='30vw' bgColor={PALETTE.quartery} boxShadow='5px 5px 3px' onClick={viewHandler.home}> Back To Menu </Button>
                </TransitionForEach>
                </VStack>
        </Center>
    </Box>
}

const WaitingView = ( {player, playerStatsMap} : any ) => {
    return <Box bgGradient={appBackgroundGradient} w='100vw' h='100vh' fontFamily='body'>
        <TransitionForEach>
            <Center w='inherit' h='80vh'>
                    <Heading as='h1' color='whitesmoke'>Waiting for {player} to pick a prompt...</Heading>
                </Center>
                <Flex h='20vh' justifyContent='center' alignItems='center'>
                    <PointBar players={playerStatsMap}></PointBar>
                </Flex>
        </TransitionForEach>
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