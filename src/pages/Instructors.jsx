import './Instructors.css'
import heather from '../assets/Heather-headshot.jpeg'
import david from '../assets/David-headshot.jpeg'
import rj from '../assets/RJ-headshot2.jpg'
import brian from '../assets/Brian-headshot.jpg'
// import teacherGroup from '../assets/instructors-group.jpg'
import teacherGroup from '../assets/teacher-group.jpg'

export default function Instructors() {
    return (
        <div className="instructors-page">
            <div className='instructors-header'>
                <h2>
                    Meet Our Instructors
                </h2>
                <img src={teacherGroup} alt="" />
            </div>
            <div className='instructor1'>
                <div className='instructor1-text'>
                    <h3>Heather Sommer</h3>
                    <h4>Owner / Creative Director</h4>
                    <p>coming soon...</p>
                </div>
                <div className='instructor1-picture'>
                    <img src={heather} alt="" />
                </div>
            </div>
            <div className='instructor2'>
                <div className='instructor2-picture'>
                    <img src={david} alt="" />
                </div>
                <div className='instructor2-text'>
                    <h3>David Sommer</h3>
                    <p>David Sommer has been an active and passionate member of the Latin dance scene for over 10 years. As part of DaytOn1 Salsa, he shares his love of dance through teaching and performing.</p>
                    <p>He is also a key member of The Get Down, which hosts one of the Midwest's premier Latin dance socials every first Sunday of the month.</p> 
                    <p>In addition to these roles, David is the organizer of Bachata Nights REMXD, creating unforgettable experiences for dancers to connect and celebrate the art of Bachata.</p>
                    <p>His love for Salsa and Bachata stems from the meaningful connections he's made within the dance community. David is deeply grateful for the friendships, energy, and inspiration that the Latin dance scene continues to bring into his life.</p>
                </div>
            </div>
            <div className='instructor1'>
                <div className='instructor1-text'>
                    <h3>Ricky RJ Williams</h3>
                    <p>Ricky RJ Williams has been dancing since 2017 and teaching since 2021. Since then, he has traveled the country learning, performing, and training. As a teacher of DaytOn1 & Salsannati, he believes that to truly understand it, you must teach it.</p> 
                    <p>As a professional musician, Ricky brings the unique combination of musicality and education background to the dance floor. The amount of relationships & opportunities that have come from wandering into a dance class one day has been irreplaceable. He hopes to create that feeling for others the same way it was created for him.
                    </p>
                </div>
                <div className='instructor1-picture'>
                    <img src={rj} alt="" />
                </div>
            </div>
            <div className='instructor2'>
                <div className='instructor2-picture'>
                    <img src={brian} alt="" />
                </div>
                <div className='instructor2-text'>
                    <h3>Brian Lugo</h3>
                    <p>coming soon...</p>
                </div>
            </div>
        </div>
    );
}