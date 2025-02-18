import './About.css'
import videoplaceholder from '../assets/Video-Placeholder.png'

export default function About() {
    return (
        <div className="about-page">
            {/* <h2 className="about-header">About Me</h2> */}
            <div className='about-content'>
                <img className="video-placeholder" src={videoplaceholder} alt="" />
                <h2 className='about-text'>
                    DaytOn1 Salsa strives to bring people together, share our love for Latin dance, and grow the dance community
                </h2>
            </div>
        </div>
    );
}