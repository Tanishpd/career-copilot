import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

export const SessionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessionDetails();
    }, [id]);

    const loadSessionDetails = async () => {
        try {
            const res = await adminAPI.getSessionDetails(id);
            if (res.data.success) {
                setSession(res.data.data.session);
                setEvaluations(res.data.data.evaluations || []);
            }
        } catch (error) {
            console.error('Error loading session details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="dashboard-container flex items-center justify-center"><div className="spinner"></div></div>;
    if (!session) return <div className="dashboard-container"><div className="alert alert-danger">Session not found</div></div>;

    // Calculate details
    const totalScore = evaluations.reduce((acc, ev) => acc + (ev.totalScore || 0), 0);
    const maxPossScore = evaluations.length * 50;
    const avgScore = evaluations.length > 0 ? (totalScore / evaluations.length).toFixed(1) : 0;

    return (
        <div className="dashboard-container">
            <div className="flex justify-between items-center mb-lg">
                <button onClick={() => navigate('/admin')} className="btn btn-outline">
                    ← Back to Dashboard
                </button>
                <div className="text-right">
                    <span className={`badge badge-${session.status === 'completed' ? 'success' : 'warning'}`}>
                        {session.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="card mb-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h2>{session.candidateId?.name || 'Unknown Candidate'}</h2>
                        <p className="text-muted">{session.candidateId?.email}</p>
                    </div>
                    <div className="text-right">
                        <h3>Total Quality Score</h3>
                        <div className="text-4xl font-bold text-primary">
                            {totalScore} <span className="text-lg text-muted">/ {session.assignedQuestions.length * 50}</span>
                        </div>
                        <p className="text-sm text-muted">Avg: {avgScore}/50</p>
                    </div>
                </div>
            </div>

            <h3>Exam Questions & Results</h3>
            <div className="grid gap-md mt-md">
                {session.assignedQuestions.length === 0 ? (
                    <div className="card text-center p-xl">
                        <p className="text-muted">No questions assigned.</p>
                    </div>
                ) : (
                    session.assignedQuestions.map((assignment, idx) => {
                        // Find matching evaluation
                        // assignment has questionId (which might be populated or just ID)
                        const qId = assignment.questionId?._id || assignment.questionId;
                        const ev = evaluations.find(e => {
                            const eQId = e.questionId?._id || e.questionId;
                            return eQId === qId;
                        });

                        const question = assignment.questionId; // Populated by backend

                        if (!ev) {
                            return (
                                <div key={idx} className="card flex justify-between items-center op-70">
                                    <div>
                                        <h4>{idx + 1}. {question?.title || 'Unknown Question'}</h4>
                                        <div className="flex gap-sm mt-xs">
                                            {question?.difficulty && (
                                                <span className={`badge badge-${question.difficulty.toLowerCase()}`}>
                                                    {question.difficulty}
                                                </span>
                                            )}
                                            <span className="badge badge-warning">Not Attempted</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-muted italic">No submission</span>
                                    </div>
                                </div>
                            );
                        }

                        // Calculate marks
                        const maxMarks = question?.difficulty === 'Easy' ? 5 : question?.difficulty === 'Medium' ? 10 : 15;
                        let marks = 0;
                        if (ev.testResults && ev.testResults.totalCount > 0) {
                            marks = (ev.testResults.passedCount / ev.testResults.totalCount) * maxMarks;
                        }
                        marks = Math.round(marks * 10) / 10;

                        return (
                            <div key={idx} className="card flex justify-between items-center">
                                <div>
                                    <h4>{idx + 1}. {question?.title || 'Unknown Question'}</h4>
                                    <div className="flex gap-sm mt-xs">
                                        <span className={`badge badge-${question?.difficulty?.toLowerCase()}`}>
                                            {question?.difficulty}
                                        </span>
                                        <span className={`badge badge-${ev.recommendation === 'Strong Yes' ? 'success' : ev.recommendation === 'Yes' ? 'info' : 'warning'}`}>
                                            {ev.recommendation}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-lg">
                                    <div>
                                        <div className="text-xl font-bold">{marks}/{maxMarks}</div>
                                        <div className="text-xs text-muted">Marks</div>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => navigate(`/admin/results/${ev._id}`)}
                                    >
                                        View Details & Code →
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
