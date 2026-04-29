import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import '../styles/global.css';
import './Login.css';

function Login() {
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
            await login(firstname, password);
            console.log('Login successful');
            navigate('/dashboard');
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.message || 'Login failed. Please check your name and password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card">
                <div className="card-header">
                    <div className="logo">FT</div>
                    <div>
                        <div className="logo-text">Fitness Tracker</div>
                        <div className="logo-subtitle">Simple, focused nutrition tracking</div>
                    </div>
                </div>
                <h1>Welcome back</h1>
                <p>Log in to continue tracking your meals and progress.</p>
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
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>
                <div className="link-row">
                    New here? <Link to="/users/new">Create an account</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;

