import './Classes.css'
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
                        <h3>MONDAYS</h3>
                        <p>Multiple Levels Offered</p>
                    </div>
                    <div className='class-schedule'>
                        <h3>CLASS SCHEDULE</h3>
                        <div className='schedule'>
                            <div className='times'>
                                <p>6:30</p>
                                <p>7:15</p>
                                <p>7:45</p>
                            </div>
                            <div className='classes'>
                                <p>Bachata</p>
                                <p>Social Dancing</p>
                                <p>Salsa</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='classes-membership-section'>
                    <div className='classes-rates'>
                        <h3>Monthly Membership Rates:</h3>
                        {/* <h3>March 2024</h3> */}
                        <div className='rates'>
                            <div className='rate-category'>
                                <p>1 Class (Salsa OR Bachata):</p>
                                <p>Both Classes:</p>
                            </div>
                            <div className='rate-cost'>
                                <p>$45</p>
                                <p>$60</p>
                            </div>
                        </div>
                        <p>Social dancing included in all monthly memberships</p>
                        <p>All monthly memberships are ONLY valid for the duration of the month that it is purchased. Classes do not roll over to the next month.</p>
                    </div>
                    <div className='classes-picture'>
                        <img src={classesPagePic} alt="picture of couples dancing in a circle" />
                    </div>
                </div>
                <div className='classes-first-time'>
                    <h3>First time? No problem!</h3>
                    <div className='first-time-info'>
                        <p>Message us each person’s name, phone number, and preferred payment method to be registered if it's your first time attending our classes</p>
                        <button>Check out our FAQs</button>
                    </div>
                </div>
            </div>
        </div>
    );
}