import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

export const ResultsViewer = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            const response = await adminAPI.getAllResults();
            setResults(response.data.data.evaluations);
        } catch (error) {
            console.error('Error loading results:', error);
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

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Candidate Results</h1>
                <p className="text-muted">View detailed evaluations and scores</p>
            </div>

            <div className="grid">
                {results.map((result) => (
                    <div
                        key={result._id}
                        className="card clickable-card"
                        onClick={() => navigate(`/admin/results/${result._id}`)}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div className="flex justify-between items-start mb-md">
                            <div>
                                <h3>{result.candidateId.name}</h3>
                                <p className="text-muted">{result.candidateId.email}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-primary">{result.examScore} / {result.maxExamScore}</h2>
                                <p className="text-xs text-muted mb-sm">Quality: {result.totalScore}/50</p>
                                <span className={`badge badge-${result.recommendation === 'Strong Yes' ? 'success' :
                                    result.recommendation === 'Yes' ? 'info' :
                                        result.recommendation === 'Borderline' ? 'warning' : 'danger'
                                    }`}>
                                    {result.recommendation}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-3 mb-md">
                            <div>
                                <p className="text-muted text-sm">Problem Understanding</p>
                                <p className="font-bold">{result.scores.problemUnderstanding}/10</p>
                            </div>
                            <div>
                                <p className="text-muted text-sm">Approach & DS</p>
                                <p className="font-bold">{result.scores.approachAndDataStructures}/10</p>
                            </div>
                            <div>
                                <p className="text-muted text-sm">Code Quality</p>
                                <p className="font-bold">{result.scores.codeQualityAndLogic}/10</p>
                            </div>
                            <div>
                                <p className="text-muted text-sm">Edge Cases</p>
                                <p className="font-bold">{result.scores.edgeCasesAndComplexity}/10</p>
                            </div>
                            <div>
                                <p className="text-muted text-sm">Communication</p>
                                <p className="font-bold">{result.scores.interactionAndCommunication}/10</p>
                            </div>
                            <div>
                                <p className="text-muted text-sm">Malpractice Risk</p>
                                <p className={`font-bold ${result.scores.malpracticeRisk > 5 ? 'text-danger' : 'text-success'}`}>
                                    {result.scores.malpracticeRisk}/10
                                </p>
                            </div>
                        </div>

                        {result.malpracticeFlags.length > 0 && (
                            <div className="alert alert-danger">
                                <strong>⚠️ Malpractice Alerts:</strong>
                                <ul>
                                    {result.malpracticeFlags.map((flag, idx) => (
                                        <li key={idx}>{flag.type}: {flag.reason}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-md">
                            <h4>Strengths</h4>
                            <ul>
                                {result.strengths.map((strength, idx) => (
                                    <li key={idx} className="text-success">✓ {strength}</li>
                                ))}
                            </ul>

                            <h4 className="mt-md">Weaknesses</h4>
                            <ul>
                                {result.weaknesses.map((weakness, idx) => (
                                    <li key={idx} className="text-warning">• {weakness}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
