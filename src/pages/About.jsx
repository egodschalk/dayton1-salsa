import './About.css'
// import headshot from '../assets/headshot2.jpg'

export default function About() {
    return (
        <div className="about-page">
            {/* <h2 className="about-header">About Me</h2> */}
            <div className='about-content'>
                {/* <img className="headshot" src={headshot} alt="" /> */}
                <p className='about-text'>
                    DaytOn1 strives to bring people together, share our love for Latin dance, and grow the dance community
                </p>
            </div>
        </div>
    );
}