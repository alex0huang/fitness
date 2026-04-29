import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
    return (
        <header>
            <Link to="/" className="brand">
                <span>FT</span> Fitness Tracker
            </Link>
            <nav>
                <a href="#features">Features</a>
                <a href="#planning">Get started</a>
                <Link to="/users/login" className="btn btn-secondary">Log in</Link>
                <Link to="/users/new" className="btn btn-primary">Start now</Link>
            </nav>
        </header>
    );
}

export default Header;

