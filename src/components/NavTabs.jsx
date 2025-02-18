import { Link, useLocation } from 'react-router-dom';
import './NavTabs.css'

function NavTabs() {
    return (
        <div className="navigation">
            <div className='nav-bar'>
                <li>About
                    <Link to="/">
                        About
                    </Link>
                </li>
            </div>
        </div>
    );
}

export default NavTabs;