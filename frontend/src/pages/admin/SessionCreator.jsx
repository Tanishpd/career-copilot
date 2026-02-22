import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';

export const SessionCreator = () => {
    const [questions, setQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [candidateName, setCandidateName] = useState('');
    const [timeLimit, setTimeLimit] = useState(120);
    const [allowHints, setAllowHints] = useState(true);
    const [maxHints, setMaxHints] = useState(2);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const questionsRes = await adminAPI.getAllQuestions();
            setQuestions(questionsRes.data.data.questions);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleCreateSession = async () => {
        if (!selectedCandidate || !candidateName || selectedQuestions.length === 0) {
            alert('Please enter candidate email, name, and select at least one question');
            return;
        }

        try {
            const response = await adminAPI.createSession({
                candidateEmail: selectedCandidate,
                candidateName: candidateName,
                questionIds: selectedQuestions,
                timeLimit,

                allowHints,
                maxHintsPerQuestion: maxHints
            });

            const { candidateCreated, emailSent, credentials } = response.data.data;

            let message = 'Session created successfully!';
            if (candidateCreated && credentials) {
                message += `\n\n✅ New candidate account created!\n\nEmail: ${credentials.email}\nPassword: ${credentials.password}\n\n${emailSent ? '📧 Credentials have been emailed to the candidate.' : '⚠️ Email sending failed. Please share credentials manually.'}`;
            }

            alert(message);
            setSelectedQuestions([]);
            setSelectedCandidate('');
            setCandidateName('');
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to create session: ' + (error.response?.data?.message || error.message));
        }
    };

    const toggleQuestion = (questionId) => {
        if (selectedQuestions.includes(questionId)) {
            setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
        } else {
            setSelectedQuestions([...selectedQuestions, questionId]);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Create Exam Session</h1>
                <p className="text-muted">Assign questions to candidates</p>
            </div>

            <div className="card mb-xl">
                <h2>Session Configuration</h2>
                <div className="form-group">
                    <label className="label">Candidate Email</label>
                    <input
                        type="email"
                        className="input"
                        placeholder="candidate@example.com"
                        value={selectedCandidate}
                        onChange={(e) => setSelectedCandidate(e.target.value)}
                    />
                    <p className="text-muted text-sm mt-sm">
                        ℹ️ If this email doesn't exist, a new account will be created automatically with a secure password.
                    </p>
                </div>

                <div className="form-group">
                    <label className="label">Candidate Name</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="John Doe"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="label">Time Limit (minutes)</label>
                    <input
                        type="number"
                        className="input"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                    />
                </div>


                <div className="form-group-inline">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={allowHints}
                            onChange={(e) => setAllowHints(e.target.checked)}
                        />
                        Allow AI Hints
                    </label>
                </div>

                {allowHints && (
                    <div className="form-group mt-md">
                        <label className="label">Max Hints Per Question</label>
                        <input
                            type="number"
                            className="input"
                            value={maxHints}
                            onChange={(e) => setMaxHints(parseInt(e.target.value))}
                            min="1"
                            max="5"
                        />
                    </div>
                )}
            </div>

            <div className="card">
                <h2>Select Questions ({selectedQuestions.length} selected)</h2>
                <div className="grid grid-2 mt-lg">
                    {questions.map((question) => (
                        <div
                            key={question._id}
                            className={`card ${selectedQuestions.includes(question._id) ? 'border-primary' : ''}`}
                            onClick={() => toggleQuestion(question._id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4>{question.title}</h4>
                                    <div className="flex gap-sm mt-sm">
                                        <span className={`badge badge-${question.difficulty.toLowerCase()}`}>
                                            {question.difficulty}
                                        </span>
                                        <span className="badge badge-primary">{question.category}</span>
                                    </div>
                                </div>
                                {selectedQuestions.includes(question._id) && (
                                    <span className="text-success">✓</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleCreateSession}
                    className="btn btn-primary mt-xl"
                    disabled={selectedQuestions.length === 0 || !selectedCandidate || !candidateName}
                >
                    Create Session
                </button>
            </div>
        </div >
    );
};
