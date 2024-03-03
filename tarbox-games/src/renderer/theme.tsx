import { extendTheme } from "@chakra-ui/react";

const customTheme = {
    fonts: {
        logo: "'Press Start 2P', sans-serif",
        body: "'Outfit Variable', sans-serif"
    },
    colors: {
        primary: '#C63D2F',
        secondary: '#E25E3E',
        tertiary: '#FF9B50',
        quartery: '#FFBB5C',
        text: {
            primary: '#FFF5E7'
        } 
    }
}

export const appBackgroundGradient = `radial(${customTheme.colors.tertiary},${customTheme.colors.primary})`


const theme = extendTheme(customTheme);
export default theme;