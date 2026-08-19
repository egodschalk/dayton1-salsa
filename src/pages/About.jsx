import './About.css'
import { Link } from 'react-router-dom'
import React from 'react'
import ReactPlayer from 'react-player'
import videoplaceholder from '../assets/dayton1-group.jpg'
import event1 from '../assets/Event-1.jpg'
import event2 from '../assets/Event-2.jpg'
import salsa from '../assets/heather-dave.jpg'
import bachata from '../assets/class-pic.jpg'
import social from '../assets/sots-group.jpg'

export default function About() {
    return (
        <div className="about-page">
            <div className='about-content'>
                <img className="video-placeholder" src={videoplaceholder} alt="" />
                <h2 className='about-text'>
                    DaytOn1 Salsa strives to bring people together, share our love for Latin dance, and grow the dance community
                </h2>
                <div className='about-class-section'>
                    <h2>Our Classes</h2>
                    <div className='about-classes'>
                        <div className='about-class-offerings'>
                            <h3 className='about-class-heading'>Salsa</h3>
                            <img src={salsa} alt="" />
                        </div>
                        <div className='about-class-offerings'>
                            <h3 className='about-class-heading'>Bachata</h3>
                            <div className='about-class-heading overlay'></div>
                            <img src={bachata} alt="" />
                        </div>
                        <div className='about-class-offerings'>
                            <h3 className='about-class-heading'>Social Dancing</h3>
                            <img src={social} alt="" />
                        </div>
                    </div>
                    <div className='about-class-buttons'>
                        <Link to="/Classes" onClick={() => window.scroll(0, 0)}>
                            <button className='about-classes-button'>and more...</button>
                        </Link>
                        <Link to="/Classes#register" onClick={() => {
                            window.scroll(0, 0)
                            setTimeout(() => {
                                const el = document.getElementById('register')
                                if (el) el.scrollIntoView({ behavior: 'smooth' })
                            }, 100)
                        }}>
                            <button className='about-enroll-button'>Enroll Here</button>
                        </Link>
                    </div>
                </div>
                <div className='about-event-section'>
                    <h2>Upcoming Events</h2>
                    <div className='about-event-content'>
                        <div className='event1'>
                            <img src={event1} alt="" />
                        </div>
                        <div className='event2'>
                            <img src={event2} alt="" />
                        </div>
                        <Link to="/Events" onClick={() => window.scroll(0, 0)}>
                            <button className='about-event-button'>more info</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}