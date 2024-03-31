import { ReactElement } from "react"
import { DEFAULT_TRANSITION } from "../../constants"
import { SlideFade } from "@chakra-ui/react"
import React from "react"


const TransitionForEach = ( {children, delay = DEFAULT_TRANSITION.DELAY} : {children: ReactElement[], delay?: number}) => {
    
    return <>
        {children.map((child: any, i: number) => {
            return <SlideFade key={i} in={true} transition={{enter: {duration: 1, ease: 'easeOut', delay: delay * i}}}>
                {child}
            </SlideFade>
        })}
    </>
}

export default TransitionForEach;