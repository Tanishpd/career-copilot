import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import Editor from '@monaco-editor/react';

export const ResultDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [evaluation, setEvaluation] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDetails();
    }, [id]);

    const loadDetails = async () => {
        try {
            const response = await adminAPI.getResultDetails(id);
            // API returns { evaluation: { ...populate(submissionId) ... } }
            // Submission is nested or we might need to fetch it? 
            // Looking at adminController.getResultDetails, it populates 'submissionId'.
            const evalData = response.data.data.evaluation;
            setEvaluation(evalData);
            setSubmission(evalData.submissionId);
        } catch (error) {
            console.error('Error loading result details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!evaluation) {
        return (
            <div className="dashboard-container">
                <div className="alert alert-danger">Result not found</div>
                <button onClick={() => navigate('/admin/results')} className="btn btn-secondary mt-md">Back to Results</button>
            </div>
        );
    }

    // Calculate Exam Score (if not already stored in DB, we compute it like in the list view)
    const maxScore = evaluation.questionId.difficulty === 'Easy' ? 5 :
        evaluation.questionId.difficulty === 'Medium' ? 10 : 15;

    let examScore = 0;
    if (evaluation.testResults && evaluation.testResults.totalCount > 0) {
        examScore = (evaluation.testResults.passedCount / evaluation.testResults.totalCount) * maxScore;
    }
    examScore = Math.round(examScore * 10) / 10;

    return (
        <div className="dashboard-container">
            <div className="flex justify-between items-center mb-lg">
                <button onClick={() => navigate('/admin/results')} className="btn btn-outline">
                    ← Back to Results
                </button>
                <div className="text-right">
                    <span className="text-muted text-sm">Session ID: {evaluation.sessionId?._id || evaluation.sessionId}</span>
                </div>
            </div>

            <div className="grid grid-2gap">
                {/* Left Column: Candidate & Question Info */}
                <div className="flex flex-col gap-md">
                    <div className="card">
                        <h3>Candidate Details</h3>
                        <p><strong>Name:</strong> {evaluation.candidateId.name}</p>
                        <p><strong>Email:</strong> {evaluation.candidateId.email}</p>
                        <p><strong>Submitted:</strong> {new Date(evaluation.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="card">
                        <h3>Question Details</h3>
                        <h4>{evaluation.questionId.title}</h4>
                        <div className="flex gap-sm mb-sm">
                            <span className="badge badge-primary">{evaluation.questionId.category}</span>
                            <span className={`badge badge-${evaluation.questionId.difficulty.toLowerCase()}`}>
                                {evaluation.questionId.difficulty}
                            </span>
                        </div>
                        <p className="text-sm text-muted">{evaluation.questionId.description.substring(0, 200)}...</p>
                    </div>

                    <div className="card">
                        <h3>Score Overview</h3>
                        <div className="flex justify-between items-center mb-md">
                            <div>
                                <span className="text-muted">Exam Score (Marks)</span>
                                <h2 className="text-primary">{examScore} / {maxScore}</h2>
                            </div>
                            <div className="text-right">
                                <span className="text-muted">AI Quality Score</span>
                                <h2>{evaluation.totalScore} / 50</h2>
                            </div>
                        </div>

                        <div className="test-results-summary p-sm bg-secondary rounded">
                            <strong>Test Cases: </strong>
                            {evaluation.testResults.passedCount} / {evaluation.testResults.totalCount} Passed
                        </div>
                    </div>
                </div>

                {/* Right Column: Code Viewer */}
                <div className="card" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                    <h3>Submitted Code</h3>
                    {submission ? (
                        <div style={{ flex: 1, border: '1px solid #333' }}>
                            <Editor
                                height="100%"
                                language={submission.language || 'javascript'}
                                theme="vs-dark"
                                value={submission.code}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 14
                                }}
                            />
                        </div>
                    ) : (
                        <p className="text-muted">Code not available</p>
                    )}
                </div>
            </div>

            {/* Bottom Section: Feedback & Analysis */}
            <div className="card mt-md">
                <h3>AI Analysis & Feedback</h3>
                <div className="grid grid-2">
                    <div>
                        <h4>Strengths</h4>
                        <ul>
                            {evaluation.strengths.map((s, i) => <li key={i} className="text-success">✓ {s}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4>Weaknesses</h4>
                        <ul>
                            {evaluation.weaknesses.map((w, i) => <li key={i} className="text-warning">• {w}</li>)}
                        </ul>
                    </div>
                </div>

                <h4 className="mt-md">Detailed Feedback</h4>
                <div className="feedback-grid grid grid-3">
                    <div className="p-sm bg-secondary rounded">
                        <strong>Logic & Correctness:</strong>
                        <p className="text-sm">{evaluation.detailedFeedback?.codeQualityAndLogic}</p>
                    </div>
                    <div className="p-sm bg-secondary rounded">
                        <strong>Approach:</strong>
                        <p className="text-sm">{evaluation.detailedFeedback?.approachAndDataStructures}</p>
                    </div>
                    <div className="p-sm bg-secondary rounded">
                        <strong>Edge Cases:</strong>
                        <p className="text-sm">{evaluation.detailedFeedback?.edgeCasesAndComplexity}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
