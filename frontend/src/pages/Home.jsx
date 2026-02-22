import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export const Home = () => {
    const { user, isAdmin, isCandidate } = useAuth();
    const navigate = useNavigate();

    const handleGetStarted = () => {
        if (user) {
            if (isAdmin) {
                navigate('/admin/dashboard');
            } else if (isCandidate) {
                navigate('/candidate/dashboard');
            }
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="home-container">
            <div className="home-hero">
                <div className="hero-content animate-fade-in">
                    <h1 className="hero-title">
                        AI-Powered Interviewer
                        <br />
                        <span className="gradient-text">Secure Hiring Platform</span>
                    </h1>
                    <p className="hero-description">
                        Conduct intelligent coding interviews with real-time AI evaluation,
                        malpractice detection, and comprehensive candidate assessment.
                    </p>
                    <div className="hero-actions">
                        <button onClick={handleGetStarted} className="btn btn-primary btn-lg">
                            Get Started
                        </button>
                        {!user && (
                            <button onClick={() => navigate('/register')} className="btn btn-outline btn-lg">
                                Create Account
                            </button>
                        )}
                    </div>
                </div>

                <div className="hero-features">
                    <div className="feature-card card-glass">
                        <div className="feature-icon">🤖</div>
                        <h3>AI Interviewer</h3>
                        <p>Interactive AI asks contextual questions while candidates code</p>
                    </div>

                    <div className="feature-card card-glass">
                        <div className="feature-icon">🔍</div>
                        <h3>Malpractice Detection</h3>
                        <p>Advanced algorithms detect AI-generated code and copy-paste behavior</p>
                    </div>

                    <div className="feature-card card-glass">
                        <div className="feature-icon">📊</div>
                        <h3>6-Category Evaluation</h3>
                        <p>Comprehensive scoring across problem understanding, code quality, and communication</p>
                    </div>

                    <div className="feature-card card-glass">
                        <div className="feature-icon">⚡</div>
                        <h3>Real-time Feedback</h3>
                        <p>Instant evaluation with detailed strengths, weaknesses, and recommendations</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
