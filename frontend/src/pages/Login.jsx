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
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || '登录失败，请检查用户名和密码');
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
                        <div className="logo-subtitle">简洁、专注的训练记录</div>
                    </div>
                </div>
                <h1>欢迎回来</h1>
                <p>登录以继续追踪你的训练与饮食。</p>
                <form onSubmit={handleSubmit}>
                    {error && <div className="error">{error}</div>}
                    <div className="field">
                        <label htmlFor="firstname">姓名</label>
                        <input
                            type="text"
                            id="firstname"
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                            placeholder="你的名字"
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="password">密码</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="输入密码"
                            required
                        />
                    </div>
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>
                <div className="link-row">
                    还没有账户？ <Link to="/users/new">注册一个</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;

