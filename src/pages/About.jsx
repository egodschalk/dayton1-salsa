import './About.css'
import { Link } from 'react-router-dom'
import React, { useRef, useState, useEffect } from 'react'
import videoplaceholder from '../assets/dayton1-group.jpg'
import event1 from '../assets/Event-1.jpg'
import event2 from '../assets/Event-2.jpg'
import salsa from '../assets/heather-dave.jpg'
import bachata from '../assets/class-pic.jpg'
import social from '../assets/sots-group.jpg'

function scrollToRegister() {
    window.scroll(0, 0)
    setTimeout(() => {
        const el = document.getElementById('register')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
}

const CLASSES = [
    { img: salsa, label: 'Salsa' },
    { img: bachata, label: 'Bachata' },
    { img: social, label: 'Social Dancing' }
]

const AUTO_ROTATE_MS = 4000
const RESUME_DELAY_MS = 6000

export default function About() {
    const trackRef = useRef(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const resumeTimeoutRef = useRef(null)
    const isProgrammaticScroll = useRef(false)

    function getCardStep() {
        const track = trackRef.current
        if (!track || !track.firstChild) return 0
        const cardWidth = track.firstChild.offsetWidth
        const gap = 14
        return cardWidth + gap
    }

    function goToSlide(index, smooth = true) {
        const track = trackRef.current
        if (!track) return
        const step = getCardStep()
        isProgrammaticScroll.current = true
        track.scrollTo({ left: index * step, behavior: smooth ? 'smooth' : 'auto' })
        setActiveIndex(index)
        window.clearTimeout(isProgrammaticScroll.timeout)
        isProgrammaticScroll.timeout = window.setTimeout(() => {
            isProgrammaticScroll.current = false
        }, 500)
    }

    function handleScroll() {
        if (isProgrammaticScroll.current) return
        const track = trackRef.current
        if (!track) return
        const step = getCardStep() || 1
        const index = Math.round(track.scrollLeft / step)
        setActiveIndex(index)
    }

    function handleManualInteraction() {
        setPaused(true)
        window.clearTimeout(resumeTimeoutRef.current)
        resumeTimeoutRef.current = window.setTimeout(() => setPaused(false), RESUME_DELAY_MS)
    }

    function handleDotClick(index) {
        handleManualInteraction()
        goToSlide(index)
    }

    // Auto-rotate
    useEffect(() => {
        if (paused) return
        const timer = window.setInterval(() => {
            setActiveIndex(prev => {
                const next = (prev + 1) % CLASSES.length
                goToSlide(next)
                return next
            })
        }, AUTO_ROTATE_MS)
        return () => window.clearInterval(timer)
    }, [paused])

    useEffect(() => {
        return () => window.clearTimeout(resumeTimeoutRef.current)
    }, [])

    return (
        <div className="about-page">

            <img className="about-top-img" src={videoplaceholder} alt="DaytOn1 Salsa group photo" />

            <div className='about-mission'>
                <h2 className='about-mission-text'>
                    DaytOn1 Salsa strives to bring people together, share our love for Latin dance, and grow the dance community
                </h2>
                <Link to="/Classes#register" onClick={scrollToRegister} className='about-early-cta'>
                    <button className='about-gold-btn'>Enroll Here</button>
                </Link>
            </div>

            <div className='about-class-section'>
                <h2>Our Classes</h2>

                <div
                    className='about-classes'
                    ref={trackRef}
                    onScroll={handleScroll}
                    onTouchStart={handleManualInteraction}
                    onMouseDown={handleManualInteraction}
                >
                    {CLASSES.map((c) => (
                        <div className='about-class-card' key={c.label}>
                            <img src={c.img} alt={c.label} />
                            <div className='about-class-card-label'>{c.label}</div>
                        </div>
                    ))}
                </div>

                <div className='about-carousel-dots'>
                    {CLASSES.map((c, i) => (
                        <button
                            key={c.label}
                            className={`about-carousel-dot ${i === activeIndex ? 'active' : ''}`}
                            onClick={() => handleDotClick(i)}
                            aria-label={`Go to ${c.label}`}
                        />
                    ))}
                </div>

                <div className='about-class-btns'>
                    <Link to="/Classes" onClick={() => window.scroll(0, 0)}>
                        <button className='about-outline-btn'>See All Classes</button>
                    </Link>
                    <Link to="/Classes#register" onClick={scrollToRegister}>
                        <button className='about-gold-btn'>Enroll Here</button>
                    </Link>
                </div>
            </div>

            <div className='about-event-section'>
                <h2>Upcoming Events</h2>
                <div className='about-event-grid'>
                    <img src={event1} alt="Upcoming event" />
                    <img src={event2} alt="Upcoming event" />
                </div>
                <Link to="/Events" onClick={() => window.scroll(0, 0)}>
                    <button className='about-outline-btn about-outline-btn-dark'>More Info</button>
                </Link>
            </div>

        </div>
    )
}