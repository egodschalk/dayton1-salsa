import './About.css'
import { Link } from 'react-router-dom'
import React from 'react'
import videoplaceholder from '../assets/dayton1-group.jpg'
import event1 from '../assets/Event-1.jpg'
import event2 from '../assets/Event-2.jpg'
import salsa from '../assets/heather-dave.jpg'
import bachata from '../assets/class-pic.jpg'
import social from '../assets/sots-group.jpg'

export default function About() {
    return (
        <div className="about-page">

            <img className="about-top-img" src={videoplaceholder} alt="DaytOn1 Salsa group photo" />

            <div className='about-mission'>
                <h2 className='about-mission-text'>
                    DaytOn1 Salsa strives to bring people together, share our love for Latin dance, and grow the dance community
                </h2>
            </div>

            <div className='about-class-section'>
                <h2>Our Classes</h2>
                <div className='about-classes'>
                    <div className='about-class-card'>
                        <img src={salsa} alt="Salsa" />
                        <div className='about-class-card-label'>Salsa</div>
                    </div>
                    <div className='about-class-card'>
                        <img src={bachata} alt="Bachata" />
                        <div className='about-class-card-label'>Bachata</div>
                    </div>
                    <div className='about-class-card'>
                        <img src={social} alt="Social Dancing" />
                        <div className='about-class-card-label'>Social Dancing</div>
                    </div>
                </div>
                <div className='about-class-btns'>
                    <Link to="/Classes" onClick={() => window.scroll(0, 0)}>
                        <button className='about-outline-btn'>See All Classes</button>
                    </Link>
                    <Link to="/Classes#register" onClick={() => {
                        window.scroll(0, 0)
                        setTimeout(() => {
                            const el = document.getElementById('register')
                            if (el) el.scrollIntoView({ behavior: 'smooth' })
                        }, 100)
                    }}>
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