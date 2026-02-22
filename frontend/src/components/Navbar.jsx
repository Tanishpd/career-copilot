import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export const Navbar = () => {
    const { user, logout, isAdmin, isCandidate } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">🤖</span>
                    <span className="logo-text">AI Interviewer</span>
                </Link>

                <div className="navbar-menu">
                    {user ? (
                        <>
                            {isAdmin && (
                                <>
                                    <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
                                    <Link to="/admin/generate" className="nav-link">🤖 AI Generator</Link>
                                    <Link to="/admin/questions" className="nav-link">Questions</Link>
                                    <Link to="/admin/sessions" className="nav-link">Sessions</Link>
                                    <Link to="/admin/results" className="nav-link">Results</Link>
                                    <Link to="/admin/rankings" className="nav-link">Rankings</Link>
                                </>
                            )}

                            {isCandidate && (
                                <>
                                    <Link to="/candidate/dashboard" className="nav-link">Dashboard</Link>
                                </>
                            )}

                            <div className="navbar-user">
                                <span className="user-name">{user.name}</span>
                                <span className="badge badge-primary">{user.role}</span>
                                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-outline">Login</Link>
                            <Link to="/register" className="btn btn-primary">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
