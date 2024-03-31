import { Box } from "@chakra-ui/react"
import React from "react"

const BoxedWord = ( {children, color} : any ) => {
    return <Box borderRadius="1rem" padding={'0.3rem'} bgColor={color} color={"whitesmoke"} display={"inline"}>{children}</Box>
}

export default BoxedWord;