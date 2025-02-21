import { Link, useLocation } from 'react-router-dom';
import './Footer.css'
import facebookLogo from '../assets/facebook-icon.png'
import instagramLogo from '../assets/instagram-icon.png'

function Footer() {

    return (
        <div className='footer'>
            <div className='socials'>
                <p className='follow'>follow us:  </p>
                <a href="https://www.facebook.com/DaytOn1Salsa" target='_blank'>
                    <img src={facebookLogo} alt="" className='social-logos'/>
                </a>
                <a href="https://www.instagram.com/dayton1salsa/" target='_blank'>
                <img src={instagramLogo} alt="" className='social-logos' />
                </a>
            </div>
            <div className='ownership'>
                <p className='copyright'>&copy; 2025 DaytOn1 Salsa - All Rights Reserved</p>
                <a href="https://www.egodschalk.com/" className='dev-stuff' target='_blank'>created by: ColorFlow Studios</a>
            </div>
        </div>
    );
}

export default Footer