import { useLocation, NavLink } from 'react-router-dom';
import { HashLink as Link } from 'react-router-hash-link'
import './Header.css'
import dayton1Logo from '../assets/DaytOn1-Logo.png'
import hamburger from '../assets/hamburger.png'
import { useState } from 'react';

function Header() {

    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen((open) => !open);
    }

    return (
        <div className="header">
            <div className="header-logo">
                <Link to="/">
                    <img className="logo" src={dayton1Logo} alt="dayton1 logo" />
                </Link>
            </div>

            <div className="navigation">
                <li class="hamburger-button" onClick={toggleMenu}>
                    <img src={hamburger} className='hamburger' alt="" />
                </li>
                <div class={`nav-bar ${isOpen ? "is-open" : ""}`} >
                    <NavLink to="/" className="nav-link" >
                        About
                    </NavLink>
                    <NavLink to="/Classes" className="nav-link">
                        Classes
                    </NavLink>
                    <NavLink to="/Events" className="nav-link">
                        Events
                    </NavLink>
                    <NavLink to="/Instructors" className="nav-link">
                        Instructors
                    </NavLink>
                    <NavLink to="/FAQs" className="nav-link">
                        FAQs
                    </NavLink>
                    <Link smooth to="#Contact" className="nav-link" >
                        Contact
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default Header