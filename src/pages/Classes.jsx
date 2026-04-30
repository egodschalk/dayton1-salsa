import './Classes.css'
import { Link } from 'react-router-dom'
import classesPagePic from '../assets/tim-teaching.png'
import level1 from '../assets/noel-1.png'
import level2 from '../assets/group-2.png'
import level3 from '../assets/rj-teaching.png'

export default function Classes() {
    return (
        <div className="classes-page">
            <div className='classes-content'>
                <div className='classes-location'>
                    <h3>NEW Location</h3>
                    <p>On Par Entertainment</p>
                    <p>4464 Indian Ripple Rd</p>
                    <p>Beavercreek, OH 45440</p>
                </div>
                <div className='classes-schedules'>
                    <div className='classes-schedule-section'>
                        <div className='days'>
                            <h3>Mondays</h3>
                            <p>May 4, 11, 18, 25</p>
                            {/* <p>(no classes Nov 24th)</p> */}
                            {/* <p>*Possible guest instructor</p> */}
                        </div>
                        <div className='class-schedule'>
                            <h3>Class Schedule</h3>
                            <div className='schedule'>
                                <div className='times'>
                                    <p>6:30</p>
                                    <p>7:15</p>
                                    <p>7:45</p>
                                </div>
                                <div className='classes'>
                                    <p>Bachata (all levels)</p>
                                    <p>Social Dancing</p>
                                    <p>Salsa (all levels)</p>
                                </div>
                            </div>

                            <div className='class-schedule'>
                                <h3>May 25:</h3>
                                {/* <h4 className='special'>All classes and social will be held at On Par Entertainment</h4> */}
                                <h4 className='special'> Social 8:30 - 10:30 PM</h4>
                                {/* <div className='schedule'>
                                    <div className='times'>
                                        <p>6:30</p>
                                        <p>7:30</p>
                                        <p>8:30</p>
                                    </div>
                                    <div className='classes'>
                                        <p>Bachata (all levels)</p>
                                        <p>Salsa (all levels)</p>
                                        <p>Social until 10:30</p>
                                    </div>
                                </div> */}
                            </div>


                            {/* <h3 className='special'>(Special Schedule)</h3> */}
                            {/* <div className='schedule'> */}
                            {/* <div className='times'>
                                    <p>6:30</p>
                                    <p>7:15</p>
                                    <p>8:00</p>
                                </div> */}
                            {/* <div className='classes'> */}
                            {/* <div className='classes2'> */}
                            {/* <p>Bachata (all levels)</p>
                                    <p>Salsa (all levels)</p> */}
                            {/* <Link to="/Events" onClick={() => {
                                        window.scroll(0, 0);
                                    }}
                                    >
                                        <p>Social @ Joui</p>
                                    </Link> */}
                            {/* </div> */}
                            {/* </div> */}
                        </div>
                    </div>
                    <div className='team-info'>
                        {/* <h3>Thursday Bachata Nights in Sharonville:</h3> */}
                        {/* <h3>An 8-week series, must pre-register</h3> */}
                        {/* <a href="https://www.facebook.com/share/r/1CgAdMbSoS/" target='_blank' className='classes-teams'>Information Here</a> */}
                        {/* <p>Message DaytOn1 with any questions</p> */}
                    </div>
                </div>
            </div>
            <div className='classes-membership-section'>
                <div className='classes-rates'>
                    <h3>Monthly Rates:</h3>
                    <h4>May</h4>
                    <p>We offer classes in monthly cycles</p>
                    <div className='rates'>
                        <div className='rate-category'>
                            <p>1 Style:</p>
                            <p>Both Styles:</p>
                        </div>
                        <div className='rate-cost'>
                            <p>$60</p>
                            <p>$80</p>
                        </div>
                    </div>
                    <p></p>
                </div>
                <div className='classes-picture'>
                    <img src={classesPagePic} alt="picture of couples dancing in a circle" />
                </div>
            </div>
            <div className='classes-first-time'>
                <h3>First time? No problem!</h3>
                <div className='first-time-info'>
                    <p>Message us each person’s name, phone number, and preferred payment method to be registered if it's your first time attending our classes</p>
                    <Link to="/FAQs" onClick={() => {
                        window.scroll(0, 0);
                    }}
                    >
                        <button>Check out our FAQs</button>
                    </Link>
                </div>
            </div>
            <div className='classes-levels-section'>
                <h2>About Our Levels</h2>
                <div className='classes-levels'>
                    <div className='class-levels'>
                        <h3 className='class-level-heading'>Level 1</h3>
                        <img src={level1} alt="" />
                        <div className='level-desc'>
                            <p><strong>Beginner: </strong>dancers with little to no experience</p>
                        </div>
                    </div>
                    <div className='class-levels'>
                        <h3 className='class-level-heading'>Level 2</h3>
                        <img src={level2} alt="" />
                        <div className='level-desc'>
                            <p><strong>Beyond the Basics: </strong>dancers with 1-2 years of experience</p>
                        </div>
                    </div>
                    <div className='class-levels'>
                        <h3 className='class-level-heading'>Level 3</h3>
                        <img src={level3} alt="" />
                        <div className='level-desc'>
                            <p><strong>Team Experience: </strong>for advanced dancers with 3 years or more experience</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}