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
            setError(err.message || '注册失败，请重试');
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
                        <div className="logo-subtitle">极简又友好的健身记录</div>
                    </div>
                </div>
                <h1>创建账户</h1>
                <p>开始记录餐饮与训练，获取个性化提醒与洞察。</p>
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
                            placeholder="设置密码"
                            required
                        />
                    </div>
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? '注册中...' : '注册'}
                    </button>
                </form>
                <div className="link-row">
                    已有账户？ <Link to="/users/login">立即登录</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;

