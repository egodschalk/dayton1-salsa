import './ScrollButton.css'
import React from 'react'
import { useEffect, useState } from 'react'

export default function ScrollButton() {

    const [scrollButton, setScrollButton] = useState(false);

    useEffect(() => {
        window.addEventListener("scroll", () => {
            if(window,scrollY > 600) {
                setScrollButton(true)
            } else {
                setScrollButton(false)
            }
        })
    }, [])

    const scrollUp = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }

    return(
        <div className='scroll-component'>
            {scrollButton && (
                <button 
                className='scroll-button'
                onClick={scrollUp}>^</button>
            )}    
        </div>
    );
}
