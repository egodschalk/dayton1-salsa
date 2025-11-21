import './About.css'
import { Link } from 'react-router-dom'
import React from 'react'
import ReactPlayer from 'react-player'
import videoplaceholder from '../assets/dayton1-group.jpg'
// import video from '../assets/heather-dave-dance.mov'
import event1 from '../assets/Event-3.jpg'
import event2 from '../assets/Event-1.jpg'
import salsa from '../assets/heather-dave.jpg'
import bachata from '../assets/class-pic.jpg'
import social from '../assets/sots-group.jpg'

export default function About() {
    return (
        <div className="about-page">
            <div className='about-content'>
                {/* <ReactPlayer
                    url={video}
                    controls={false}
                    className='video'
                    playing={true}
                    loop={true}
                    width='100%'
                /> */}
                {/* <video className='video' autoPlay loop muted>
                    <source src={video} type='video/mp4' />
                </video> */}
                <img className="video-placeholder" src={videoplaceholder} alt="" />
                <h2 className='about-text'>
                    DaytOn1 Salsa strives to bring people together, share our love for Latin dance, and grow the dance community
                </h2>
                <div className='about-class-section'>
                    <h2>Our Classes</h2>
                    <div className='about-classes'>
                        <div className='about-class-offerings'>
                            {/* <Link to="/Classes#" onClick={() => {
                                window.scroll(0, 0);
                            }}
                            > */}
                                <h3 className='about-class-heading'>Salsa</h3>
                                <img src={salsa} alt="" />
                            {/* </Link> */}
                        </div>
                        <div className='about-class-offerings'>
                            {/* <Link to="/Classes#" onClick={() => {
                                window.scroll(0, 0);
                            }}
                            > */}
                                <h3 className='about-class-heading'>Bachata</h3>
                                <div className='about-class-heading overlay'></div>
                                <img src={bachata} alt="" />
                            {/* </Link> */}
                        </div>
                        <div className='about-class-offerings'>
                            {/* <Link to="/Classes#" onClick={() => {
                                window.scroll(0, 0);
                            }}
                            > */}
                                <h3 className='about-class-heading'>Social Dancing</h3>
                                <img src={social} alt="" />
                            {/* </Link> */}
                        </div>
                    </div>
                    <Link to="/Classes" onClick={() => {
                        window.scroll(0, 0);
                    }}
                    >
                        <button className='about-classes-button'>and more...</button>
                    </Link>
                </div>
                {/* <div className='about-event-section'>
                    <h2>Upcoming Events</h2>
                    <div className='about-event-content'>
                        <div className='event1'>
                            <img src={event1} alt="" />
                        </div>
                        {/* <div className='event2'>
                            <img src={event2} alt="" />
                        </div> */}
                        {/* <Link to="/Events" onClick={() => {
                            window.scroll(0, 0);
                        }}
                        >
                            <button className='about-event-button'>more info</button>
                        </Link> */}
                    {/* </div>

                </div> */}
            </div>
        </div>
    );
}