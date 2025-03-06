import './Instructors.css'
import heather from '../assets/Heather-headshot.jpeg'
import david from '../assets/David-headshot.jpeg'

export default function Instructors() {
    return (
        <div className="instructors-page">
            <div className='instructors-header'>
                <h2>
                    Meet Our Instructors
                </h2>
            </div>
            <div className='instructor1'>
                <div className='instructor1-text'>
                    <h3>Heather Sommer</h3>
                    <h4>Owner / Creative Director</h4>
                    <p>text here...</p>
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
                    <p>text here...</p>
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
                    <h3>Brian Lugo</h3>
                    <p>text here...</p>
                </div>
            </div>
        </div>
    );
}