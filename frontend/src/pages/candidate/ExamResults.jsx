import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAPI } from '../../utils/api';
import './ExamResults.css';

export const ExamResults = () => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            const response = await candidateAPI.getResults();
            setResults(response.data.data);
        } catch (error) {
            console.error('Error loading results:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="results-container flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="results-container flex items-center justify-center">
                <div className="card text-center">
                    <h2>No Results Found</h2>
                    <button onClick={() => navigate('/candidate/dashboard')} className="btn btn-primary mt-md">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const { summary, results: questionResults } = results;

    return (
        <div className="results-container animate-fade-in">
            <div className="results-header text-center">
                <h1>Exam Completed</h1>
                <p className="subtitle">Thank you for completing the assessment.</p>
                <p className="subtitle">Your results have been submitted for review.</p>

                {/* Score hidden from candidate */}
                {/* <div className="score-card">
                    <div className="score-circle">
                        <span className="sc-value">{summary.percentage}%</span>
                        <span className="sc-label">Total Score</span>
                    </div>
                    <div className="score-details">
                        <div className="sd-item">
                            <span className="sd-label">Points</span>
                            <span className="sd-value">{summary.totalScore} / {summary.totalMaxScore}</span>
                        </div>
                    </div>
                </div> */}
            </div>

            <div className="results-content">
                <h2>Detailed Breakdown</h2>
                <div className="questions-list">
                    {questionResults.map((q, idx) => (
                        <div key={idx} className={`result-card ${q.score === q.maxScore ? 'perfect' : q.score > 0 ? 'partial' : 'failed'}`}>
                            <div className="rc-header">
                                <h3>{idx + 1}. {q.question.title}</h3>
                                {/* <div className="rc-score">
                                    <span className="badge badge-info">{q.score.toFixed(1)} / {q.maxScore}</span>
                                </div> */}
                            </div>
                            <div className="rc-body">
                                <div className="rc-stats">
                                    <div className="stat">
                                        <strong>Test Cases:</strong> {q.testResults.passedCount}/{q.testResults.totalCount} Passed
                                    </div>
                                    <div className="stat">
                                        <strong>Difficulty:</strong> {q.question.difficulty}
                                    </div>
                                </div>
                                {q.feedback && (
                                    <div className="rc-feedback">
                                        <h4>Feedback</h4>
                                        <p>{q.feedback}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="results-footer">
                <button onClick={() => navigate('/candidate/dashboard')} className="btn btn-primary btn-lg">
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};
