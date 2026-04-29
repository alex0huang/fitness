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
                            <div className="eyebrow">Smart fitness companion</div>
                            <h1>Track every meal. Amplify every effort.</h1>
                            <p className="lead">Log your daily meals and macros, stay focused with clear insights, and move closer to your goals—one day at a time.</p>
                            <div className="cta-row">
                                <Link to="/users/new" className="btn btn-primary">Create account</Link>
                                <Link to="/users/login" className="btn btn-secondary">Already have an account? Log in</Link>
                            </div>
                            <div className="stats">
                                <div className="stat">
                                    <h3>1200+</h3>
                                    <p>Meals logged daily</p>
                                </div>
                                <div className="stat">
                                    <h3>7 天</h3>
                                    <p>Average time to build a habit</p>
                                </div>
                            </div>
                        </div>
                        <div className="summary-card">
                            <h4>Today at a glance</h4>
                            <div className="panel-grid" style={{ gridTemplateColumns: '1fr', gap: '12px', marginTop: '8px' }}>
                                <div className="panel" style={{ margin: 0, background: '#f8fafc', borderStyle: 'dashed', borderColor: '#dbeafe', boxShadow: 'none' }}>
                                    <h4 style={{ marginBottom: '4px' }}>Macros</h4>
                                    <p>Protein 92g · Carbs 160g · Fat 48g</p>
                                </div>
                            </div>
                            <div className="pill-row" style={{ marginTop: '18px' }}>
                                <span className="pill">Food log</span>
                                <span className="pill">Progress</span>
                            </div>
                        </div>
                    </section>

                    <section id="features" className="panel-grid">
                        <div className="panel">
                            <h4>Log & compare</h4>
                            <p>Record meals fast and see daily/weekly summaries to spot progress in your trends.</p>
                        </div>
                        <div className="panel">
                            <h4>Goal tracking</h4>
                            <p>Set daily targets (calories, protein, carbs, fat) and keep an eye on your progress.</p>
                        </div>
                    </section>

                    <section id="planning" style={{ marginTop: '28px' }}>
                        <div className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', alignItems: 'center' }}>
                            <div>
                                <h4>Ready to start?</h4>
                                <p style={{ marginTop: '8px', color: 'var(--muted)' }}>Create an account, log your first meal today, and start building momentum with clear, consistent tracking.</p>
                            </div>
                            <div className="cta-row">
                                <Link to="/users/new" className="btn btn-primary">Create now</Link>
                                <Link to="/users/login" className="btn btn-secondary">I have an account</Link>
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

