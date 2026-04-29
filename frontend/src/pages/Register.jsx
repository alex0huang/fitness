import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import '../styles/global.css';
import './Login.css';

function Register() {
    const [firstname, setFirstname] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(firstname, password);
            navigate('/users/login');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card" style={{ width: 'min(440px, 100%)' }}>
                <div className="card-header">
                    <div className="logo">FT</div>
                    <div>
                        <div className="logo-text">Fitness Tracker</div>
                        <div className="logo-subtitle">Minimal and friendly meal tracking</div>
                    </div>
                </div>
                <h1>Create your account</h1>
                <p>Start logging meals and get clear insights as you go.</p>
                <form onSubmit={handleSubmit}>
                    {error && <div className="error">{error}</div>}
                    <div className="field">
                        <label htmlFor="firstname">Name</label>
                        <input
                            type="text"
                            id="firstname"
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                            placeholder="Your name"
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Set a password"
                            required
                        />
                    </div>
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Creating...' : 'Create account'}
                    </button>
                </form>
                <div className="link-row">
                    Already have an account? <Link to="/users/login">Log in</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;

