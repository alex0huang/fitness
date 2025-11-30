import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
    return (
        <header>
            <Link to="/" className="brand">
                <span>FT</span> Fitness Tracker
            </Link>
            <nav>
                <a href="#features">特色</a>
                <a href="#planning">计划</a>
                <Link to="/users/login" className="btn btn-secondary">登录</Link>
                <Link to="/users/new" className="btn btn-primary">立即开始</Link>
            </nav>
        </header>
    );
}

export default Header;

