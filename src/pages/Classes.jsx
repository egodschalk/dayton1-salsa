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
                    <h3>Location</h3>
                    <p>Genuine Work</p>
                    <p>15 Mc Donough Street</p>
                    <p>Dayton, OH 45402</p>
                </div>
                <div className='classes-schedule-section'>
                    <div className='days'>
                        <h3>Mondays</h3>
                        <p>March 3rd, 10th, 17th, 24th</p>
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
                        <h3>March 24</h3> 
                        <h3 className='special-schedule'>(Special Schedule)</h3>
                        <div className='schedule'>
                            <div className='times'>
                                <p>6:30</p>
                                <p>7:15</p>
                                <p>8:00</p>
                            </div>
                            <div className='classes'>
                                <p>Bachata (all levels)</p>
                                <p>Salsa</p>
                                <Link to="/Events" onClick={() => {
                                    window.scroll(0, 0);
                                }}
                                >
                                    <p>Latin Night at Joui</p>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='classes-membership-section'>
                    <div className='classes-rates'>
                        <h3>Monthly Rates:</h3>
                        <h3>March</h3>

                        <p>We offer classes in monthly cycles</p>
                        {/* <h3>March 2024</h3> */}
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
                        <p>Social dancing included in all monthly memberships</p>
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
                                <p><strong>Next Level: </strong>for advanced dancers with 3 years or more experience</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}