import { Link, useLocation } from 'react-router-dom';
import './Header.css'
import dayton1logo from '../assets/DaytOn1-Logo.png'

function Header() {

    return (
        <div className="header">
            {/* <h1 className="header-h1">Elizabeth Godschalk</h1> */}
            <img className="logo" src={dayton1logo} alt="dayton1 logo" />
        </div>
    );
}

export default Header