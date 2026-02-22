import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import './AdminDashboard.css';

export const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalQuestions: 0,
        totalSessions: 0,
        totalCandidates: 0,
        avgScore: 0,
        malpracticeAlerts: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentSessions, setRecentSessions] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // overview, questions, sessions
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [questionsRes, sessionsRes, resultsRes] = await Promise.all([
                adminAPI.getAllQuestions(),
                adminAPI.getAllSessions(),
                adminAPI.getAllResults()
            ]);

            const questions = questionsRes.data.data.questions;
            const sessions = sessionsRes.data.data.sessions;
            const results = resultsRes.data.data.evaluations;

            // Calculate stats
            const totalScore = results.reduce((sum, r) => sum + r.totalScore, 0);
            const avgScore = results.length > 0 ? (totalScore / results.length).toFixed(2) : 0;
            const malpracticeAlerts = results.filter(r => r.malpracticeFlags.length > 0).length;

            setStats({
                totalQuestions: questions.length,
                totalSessions: sessions.length,
                totalCandidates: new Set(sessions.map(s => s.candidateId._id)).size,
                avgScore,
                malpracticeAlerts
            });

            setRecentSessions(sessions.slice(0, 5));
            setQuestions(questions);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                await adminAPI.deleteQuestion(id);
                setQuestions(questions.filter(q => q._id !== id));
                // Update stats locally
                setStats(prev => ({ ...prev, totalQuestions: prev.totalQuestions - 1 }));
            } catch (error) {
                console.error('Error deleting question:', error);
                alert('Failed to delete question');
            }
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <p className="text-muted">Overview of your AI Interviewer platform</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card card-glass">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                        <h3>{stats.totalQuestions}</h3>
                        <p>Total Questions</p>
                    </div>
                </div>

                <div className="stat-card card-glass">
                    <div className="stat-icon">📝</div>
                    <div className="stat-content">
                        <h3>{stats.totalSessions}</h3>
                        <p>Exam Sessions</p>
                    </div>
                </div>

                <div className="stat-card card-glass">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>{stats.totalCandidates}</h3>
                        <p>Candidates</p>
                    </div>
                </div>

                <div className="stat-card card-glass">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                        <h3>{stats.avgScore}/50</h3>
                        <p>Average Score</p>
                    </div>
                </div>

                <div className="stat-card card-glass">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <h3>{stats.malpracticeAlerts}</h3>
                        <p>Malpractice Alerts</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('questions')}
                    >
                        Questions
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <div className="card">
                        <h2>Recent Sessions</h2>
                        {recentSessions.length === 0 ? (
                            <p className="text-muted">No sessions yet</p>
                        ) : (
                            <div className="sessions-list">
                                {recentSessions.map((session) => (
                                    <div
                                        key={session._id}
                                        className="session-item clickable-card"
                                        onClick={() => window.location.href = `/admin/sessions/${session._id}`}
                                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                    >
                                        <div className="session-info">
                                            <h4>{session.candidateId?.name || 'Unknown Candidate'}</h4>
                                            <p className="text-muted">{session.candidateId?.email}</p>
                                        </div>
                                        <div className="session-meta">
                                            <span className={`badge badge-${session.status === 'completed' ? 'success' : session.status === 'in-progress' ? 'warning' : 'info'}`}>
                                                {session.status}
                                            </span>
                                            <span className="text-muted">
                                                {session.assignedQuestions.length} questions
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'questions' && (
                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h2>Question Bank</h2>
                            <button className="btn btn-primary" onClick={() => window.location.href = '/admin/generate'}>
                                + Add Question
                            </button>
                        </div>

                        <div className="questions-list">
                            {questions.map((q) => (
                                <div key={q._id} className="question-item">
                                    <div className="question-info">
                                        <h4>{q.title}</h4>
                                        <div className="flex gap-sm mt-1">
                                            <span className={`badge badge-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                                            <span className="badge badge-info">{q.category}</span>
                                        </div>
                                    </div>
                                    <div className="question-actions">
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDeleteQuestion(q._id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
