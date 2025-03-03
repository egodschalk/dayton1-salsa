import './About.css'
import { Link } from 'react-router-dom'
import videoplaceholder from '../assets/dayton1-group.jpg'
import noel1 from '../assets/noel-1.png'
import group2 from '../assets/group-2.png'
import timTeach from '../assets/tim-teaching.png'
import event1 from '../assets/Event-1.png'
import event2 from '../assets/Event-2.jpeg'

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
                            <Link to="/Classes#" onClick={() => {
                                window.scroll(0, 0);
                            }}
                            >
                                <h3 className='about-class-heading'>Salsa</h3>
                                <img src={noel1} alt="" />
                            </Link>
                        </div>
                        <div className='about-class-offerings'>
                            <Link to="/Classes#" onClick={() => {
                                window.scroll(0, 0);
                            }}
                            >
                                <h3 className='about-class-heading'>Bachata</h3>
                                <img src={group2} alt="" />
                            </Link>
                        </div>
                        <div className='about-class-offerings'>
                            <Link to="/Classes#" onClick={() => {
                                window.scroll(0, 0);
                            }}
                            >
                                <h3 className='about-class-heading'>Social Hour</h3>
                                <img src={timTeach} alt="" />
                            </Link>
                        </div>
                    </div>
                    <Link to="/Classes" onClick={() => {
                        window.scroll(0, 0);
                    }}
                    >
                        <h4>and more...</h4>
                    </Link>
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
                    </div>
                </div>
            </div>
        </div>
    );
}