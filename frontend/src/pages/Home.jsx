import { Link } from 'react-router-dom';
import Header from '../components/Header';
import './Home.css';

function Home() {
    const currentYear = new Date().getFullYear();

    return (
        <>
            <Header />
            <main>
                <div className="shell">
                    <section className="hero">
                        <div>
                            <div className="eyebrow">智能健身助理</div>
                            <h1>记录每一次餐饮，放大每一分努力</h1>
                            <p className="lead">跟踪你的每日餐饮与营养摄入，使用数据化的方式帮助你保持专注、持续复盘，离目标更近一步。</p>
                            <div className="cta-row">
                                <Link to="/users/new" className="btn btn-primary">注册账号</Link>
                                <Link to="/users/login" className="btn btn-secondary">已有账户？登录</Link>
                            </div>
                            <div className="stats">
                                <div className="stat">
                                    <h3>1200+</h3>
                                    <p>每日记录的餐饮</p>
                                </div>
                                <div className="stat">
                                    <h3>7 天</h3>
                                    <p>快速形成习惯的平均时间</p>
                                </div>
                            </div>
                        </div>
                        <div className="summary-card">
                            <h4>今日概览</h4>
                            <div className="panel-grid" style={{ gridTemplateColumns: '1fr', gap: '12px', marginTop: '8px' }}>
                                <div className="panel" style={{ margin: 0, background: '#f8fafc', borderStyle: 'dashed', borderColor: '#dbeafe', boxShadow: 'none' }}>
                                    <h4 style={{ marginBottom: '4px' }}>营养摄入</h4>
                                    <p>蛋白质 92g · 碳水 160g · 脂肪 48g</p>
                                </div>
                            </div>
                            <div className="pill-row" style={{ marginTop: '18px' }}>
                                <span className="pill">饮食日记</span>
                                <span className="pill">进度追踪</span>
                            </div>
                        </div>
                    </section>

                    <section id="features" className="panel-grid">
                        <div className="panel">
                            <h4>记录 & 对比</h4>
                            <p>快速记录餐饮，自动汇总每日/每周数据，帮助你从趋势中发现进步。</p>
                        </div>
                        <div className="panel">
                            <h4>目标管理</h4>
                            <p>设定每日营养目标（卡路里、蛋白质、碳水化合物、脂肪），跟踪你的摄入进度。</p>
                        </div>
                    </section>

                    <section id="planning" style={{ marginTop: '28px' }}>
                        <div className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', alignItems: 'center' }}>
                            <div>
                                <h4>准备好开始了吗？</h4>
                                <p style={{ marginTop: '8px', color: 'var(--muted)' }}>创建一个账户，记录你今天的第一顿餐饮，系统会根据你的数据给出下一步建议。</p>
                            </div>
                            <div className="cta-row">
                                <Link to="/users/new" className="btn btn-primary">立即创建</Link>
                                <Link to="/users/login" className="btn btn-secondary">我已有账户</Link>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <footer>
                © {currentYear} Fitness Tracker · Keep moving, stay consistent.
            </footer>
        </>
    );
}

export default Home;

