import { Link, useLocation, NavLink } from 'react-router-dom';
import './Header.css'
import dayton1logo from '../assets/DaytOn1-Logo.png'

function Header() {

    return (
        <div className="header">
            <div className="header-logo">
                <Link to="/">
                    <img className="logo" src={dayton1logo} alt="dayton1 logo" />
                </Link>
            </div>

            <div className="navigation">
                <div className='nav-bar'>
                    <NavLink to="/" className="nav-link" activeClassName="nav-link-active">
                        About
                    </NavLink>
                    <NavLink to="" className="nav-link" activeClassName="active-link">
                        Classes
                    </NavLink>
                    <NavLink to="" className="nav-link" activeClassName="active-link">
                        Events
                    </NavLink>
                    <NavLink to="" className="nav-link" activeClassName="active-link">
                        Instructors
                    </NavLink>
                    <NavLink to="" className="nav-link" activeClassName="active-link">
                        FAQs
                    </NavLink>
                    <NavLink to="" className="nav-link" activeClassName="active-link">
                        Contact
                    </NavLink>
                </div>
            </div>
        </div>
    );
}

export default Header