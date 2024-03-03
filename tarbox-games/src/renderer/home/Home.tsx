import React, { useContext } from "react";
import { TarboxViewHandler } from "../../types";
import { Button, Flex, Center, VStack, Heading, Container, Text, Alert, AlertIcon, useToast } from "@chakra-ui/react";
import { PALETTE, TEXT } from "../../constants";
import { appBackgroundGradient } from "../theme";
import AppContext from "../AppContext";

const Home = () => {
    const showMessage = useToast();
    const toastID = 'tarbox-home-page';

    const context = useContext(AppContext);
    const viewHandler = context.viewHandlerProvider.get();

    return <Flex direction='column' h='100vh' w='100vw' bgGradient={appBackgroundGradient} color={TEXT.primary} paddingTop='10vh'> 
        <Center w='100vw' gap='10vh' h='10vh'>
            <Heading as='h2' size='3xl'  border='1px' borderRadius='10px' fontFamily='logo' padding='30px'> Tarbox Games </Heading>
        </Center>
        <Center w='100vw' gap='10vh' h='20vh' fontSize='x-large'>
            <Heading as='h2' size='xl' fontFamily='body'> Welcome to Tarbox Games! </Heading>
        </Center>
        <Center w='100vw' h='10vh' fontSize='x-large'>
            <Heading as='h2' size='md' fontFamily='body'> Pick a game. </Heading>
        </Center>
        <Center>
            <VStack justifyContent='center' alignItems='center' gap='2vh' paddingTop='5vh'>
                <Button w='30vw' bgColor={PALETTE.quartery} boxShadow='5px 5px 3px' onClick={() => {
                    viewHandler.wordfinder?.();
                }}>Word Finder</Button>
                <Button w='30vw' bgColor={PALETTE.quartery} boxShadow='5px 5px 3px' onClick={() => {
                    if(!showMessage.isActive(toastID)) {
                        return showMessage({
                            id: toastID,
                            title: "Mover",
                            description: "Not implemented yet. Coming soon!",
                            status: 'info',
                            duration: 3000,
                        });
                    }
                }}>Mover</Button>
            </VStack>
        </Center>
    </Flex>
};

export default Home;