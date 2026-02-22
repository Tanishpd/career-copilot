import { useState } from 'react';
import { adminAPI } from '../../utils/api';
import './AdminDashboard.css';

export const ExamGenerator = () => {
    const [activeTab, setActiveTab] = useState('aptitude'); // aptitude, coding, mixed
    const [loading, setLoading] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);

    // Aptitude form state
    const [aptitudeForm, setAptitudeForm] = useState({
        count: 5,
        difficulty: 'Medium',
        topics: [],
        type: 'MCQ'
    });

    // Coding form state
    const [codingForm, setCodingForm] = useState({
        easyCount: 1,
        mediumCount: 1,
        hardCount: 1
    });

    const topicOptions = [
        'Percentage', 'Profit & Loss', 'Time & Work', 'Speed Distance Time',
        'Reasoning', 'Number System', 'Algebra', 'Geometry', 'Probability'
    ];

    const problemTypes = [
        'Data Structures', 'Algorithms', 'Dynamic Programming', 'Graphs',
        'Trees', 'Strings', 'Arrays', 'Linked Lists', 'Sorting', 'Searching'
    ];

    const handleTopicToggle = (topic) => {
        setAptitudeForm(prev => ({
            ...prev,
            topics: prev.topics.includes(topic)
                ? prev.topics.filter(t => t !== topic)
                : [...prev.topics, topic]
        }));
    };

    const handleGenerateAptitude = async () => {
        if (aptitudeForm.topics.length === 0) {
            alert('Please select at least one topic');
            return;
        }

        setLoading(true);
        setGeneratedQuestions([]);

        try {
            const response = await adminAPI.generateAptitudeQuestions(aptitudeForm);
            setGeneratedQuestions(response.data.data.questions);
        } catch (error) {
            console.error('Error generating aptitude questions:', error);
            alert('Failed to generate questions. Please check if the AI API is configured correctly.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCoding = async () => {
        const { easyCount, mediumCount, hardCount } = codingForm;
        if (easyCount === 0 && mediumCount === 0 && hardCount === 0) {
            alert('Please select at least 1 question.');
            return;
        }

        setLoading(true);
        setGeneratedQuestions([]);

        try {
            const promises = [];
            if (easyCount > 0) promises.push(adminAPI.generateCodingQuestions({ count: easyCount, difficulty: 'Easy', problemType: 'Mixed' }));
            if (mediumCount > 0) promises.push(adminAPI.generateCodingQuestions({ count: mediumCount, difficulty: 'Medium', problemType: 'Mixed' }));
            if (hardCount > 0) promises.push(adminAPI.generateCodingQuestions({ count: hardCount, difficulty: 'Hard', problemType: 'Mixed' }));

            const results = await Promise.all(promises);
            const allQuestions = results.flatMap(res => res.data.data.questions);

            setGeneratedQuestions(allQuestions);
        } catch (error) {
            console.error('Error generating coding questions:', error);
            alert('Failed to generate questions. Please check if the AI API is configured correctly.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateMixed = async () => {
        if (aptitudeForm.topics.length === 0) {
            alert('Please select at least one topic for Aptitude section');
            return;
        }

        const { easyCount, mediumCount, hardCount } = codingForm;
        if (easyCount === 0 && mediumCount === 0 && hardCount === 0) {
            alert('Please select at least 1 coding question.');
            return;
        }

        setLoading(true);
        setGeneratedQuestions([]);

        try {
            const promises = [adminAPI.generateAptitudeQuestions(aptitudeForm)];
            if (easyCount > 0) promises.push(adminAPI.generateCodingQuestions({ count: easyCount, difficulty: 'Easy', problemType: 'Mixed' }));
            if (mediumCount > 0) promises.push(adminAPI.generateCodingQuestions({ count: mediumCount, difficulty: 'Medium', problemType: 'Mixed' }));
            if (hardCount > 0) promises.push(adminAPI.generateCodingQuestions({ count: hardCount, difficulty: 'Hard', problemType: 'Mixed' }));

            const results = await Promise.all(promises);
            const aptitudeRes = results[0];
            const codingResults = results.slice(1);

            const aptitudeQuestions = aptitudeRes.data.data.questions.map(q => ({ ...q, category: 'Aptitude' }));
            const codingQuestions = codingResults.flatMap(res => res.data.data.questions).map(q => ({ ...q, category: 'DSA' }));

            setGeneratedQuestions([...aptitudeQuestions, ...codingQuestions]);
        } catch (error) {
            console.error('Error generating mixed questions:', error);
            alert('Failed to generate mixed questions. Please check if the AI API is configured correctly.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveQuestions = async () => {
        try {
            let savedCount = 0;
            for (const question of generatedQuestions) {
                // Transform question to match database schema
                // Transform question to match database schema
                const questionData = {
                    title: question.title || question.question || 'Generated Question',
                    description: question.description || question.question || '',
                    category: question.category || (activeTab === 'aptitude' ? 'Aptitude' : 'DSA'),
                    difficulty: question.difficulty || 'Medium',
                    constraints: question.constraints || '',
                    inputFormat: question.inputFormat || '',
                    outputFormat: question.outputFormat || '',
                    sampleInput: question.sampleInput || '',
                    sampleOutput: question.sampleOutput || '',
                    testCases: question.testCases || [],
                    explanation: question.explanation || '',
                    options: question.options || [],
                    answer: question.answer || '',
                    tags: [question.category, question.difficulty, question.problemType || 'General'].filter(Boolean)
                };

                try {
                    await adminAPI.createQuestion(questionData);
                    savedCount++;
                } catch (err) {
                    console.error('Failed to save question:', err);
                }
            }

            if (savedCount === generatedQuestions.length) {
                alert(`✅ Successfully saved all ${savedCount} questions!`);
            } else {
                alert(`⚠️ Saved ${savedCount} out of ${generatedQuestions.length} questions`);
            }
            setGeneratedQuestions([]);
        } catch (error) {
            console.error('Error saving questions:', error);
            alert('Failed to save questions');
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>🤖 AI Exam Generator</h1>
                <p className="text-muted">Generate exam questions instantly using AI</p>
            </div>

            {/* Tab Navigation */}
            <div className="tabs mb-xl">
                <button
                    className={`tab ${activeTab === 'aptitude' ? 'active' : ''}`}
                    onClick={() => setActiveTab('aptitude')}
                >
                    📊 Aptitude
                </button>
                <button
                    className={`tab ${activeTab === 'coding' ? 'active' : ''}`}
                    onClick={() => setActiveTab('coding')}
                >
                    💻 Coding
                </button>
                <button
                    className={`tab ${activeTab === 'mixed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mixed')}
                >
                    🔀 Mixed
                </button>
            </div>

            {/* Aptitude Form */}
            {activeTab === 'aptitude' && (
                <div className="card mb-xl">
                    <h2>Generate Aptitude Questions</h2>
                    <div className="auth-form">
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Number of Questions</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="1"
                                    max="20"
                                    value={aptitudeForm.count}
                                    onChange={(e) => setAptitudeForm({ ...aptitudeForm, count: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Difficulty Level</label>
                                <select
                                    className="input"
                                    value={aptitudeForm.difficulty}
                                    onChange={(e) => setAptitudeForm({ ...aptitudeForm, difficulty: e.target.value })}
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Question Type</label>
                            <div className="flex gap-md">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="MCQ"
                                        checked={aptitudeForm.type === 'MCQ'}
                                        onChange={(e) => setAptitudeForm({ ...aptitudeForm, type: e.target.value })}
                                    />
                                    <span>Multiple Choice (MCQ)</span>
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="Fill-in-the-blank"
                                        checked={aptitudeForm.type === 'Fill-in-the-blank'}
                                        onChange={(e) => setAptitudeForm({ ...aptitudeForm, type: e.target.value })}
                                    />
                                    <span>Fill in the Blank</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Topics (Select at least one)</label>
                            <div className="topics-grid">
                                {topicOptions.map(topic => (
                                    <label key={topic} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={aptitudeForm.topics.includes(topic)}
                                            onChange={() => handleTopicToggle(topic)}
                                        />
                                        <span>{topic}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateAptitude}
                            className="btn btn-primary"
                            disabled={loading || aptitudeForm.topics.length === 0}
                        >
                            {loading ? '⏳ Generating...' : '✨ Generate Questions'}
                        </button>
                    </div>
                </div>
            )}

            {/* Coding Form */}
            {activeTab === 'coding' && (
                <div className="card mb-xl">
                    <h2>Generate Coding Questions</h2>
                    <div className="auth-form">
                        <div className="grid grid-3">
                            <div className="form-group">
                                <label className="label">Easy Questions</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="0"
                                    max="10"
                                    value={codingForm.easyCount}
                                    onChange={(e) => setCodingForm({ ...codingForm, easyCount: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Medium Questions</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="0"
                                    max="10"
                                    value={codingForm.mediumCount}
                                    onChange={(e) => setCodingForm({ ...codingForm, mediumCount: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Hard Questions</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="0"
                                    max="10"
                                    value={codingForm.hardCount}
                                    onChange={(e) => setCodingForm({ ...codingForm, hardCount: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateCoding}
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? '⏳ Generating...' : '✨ Generate Questions'}
                        </button>
                    </div>
                </div>
            )}

            {/* Mixed Form */}
            {activeTab === 'mixed' && (
                <div className="card mb-xl">
                    <h2>Generate Mixed Exam</h2>
                    <p className="text-muted mb-md">Generate a mix of Aptitude and Coding questions.</p>

                    <div className="auth-form">
                        <div className="grid grid-2">
                            <div className="card-glass p-md">
                                <h3>Aptitude Settings</h3>
                                <div className="form-group mt-sm">
                                    <label className="label">Count</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min="1"
                                        max="10"
                                        value={aptitudeForm.count}
                                        onChange={(e) => setAptitudeForm({ ...aptitudeForm, count: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Topics</label>
                                    <div className="topics-grid small">
                                        {topicOptions.slice(0, 6).map(topic => (
                                            <label key={topic} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={aptitudeForm.topics.includes(topic)}
                                                    onChange={() => handleTopicToggle(topic)}
                                                />
                                                <span>{topic}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="card-glass p-md">
                                <h3>Coding Settings</h3>
                                <div className="grid grid-3 gap-sm mt-sm">
                                    <div className="form-group">
                                        <label className="label text-xs">Easy</label>
                                        <input
                                            type="number"
                                            className="input input-sm"
                                            min="0"
                                            max="5"
                                            value={codingForm.easyCount}
                                            onChange={(e) => setCodingForm({ ...codingForm, easyCount: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label text-xs">Medium</label>
                                        <input
                                            type="number"
                                            className="input input-sm"
                                            min="0"
                                            max="5"
                                            value={codingForm.mediumCount}
                                            onChange={(e) => setCodingForm({ ...codingForm, mediumCount: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label text-xs">Hard</label>
                                        <input
                                            type="number"
                                            className="input input-sm"
                                            min="0"
                                            max="5"
                                            value={codingForm.hardCount}
                                            onChange={(e) => setCodingForm({ ...codingForm, hardCount: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateMixed}
                            className="btn btn-primary mt-lg"
                            disabled={loading || aptitudeForm.topics.length === 0}
                        >
                            {loading ? '⏳ Generating...' : '✨ Generate Mixed Exam'}
                        </button>
                    </div>
                </div>
            )}

            {/* Generated Questions Display */}
            {generatedQuestions.length > 0 && (
                <div className="card">
                    <div className="flex justify-between items-center mb-lg">
                        <h2>Generated Questions ({generatedQuestions.length})</h2>
                        <button onClick={handleSaveQuestions} className="btn btn-success">
                            💾 Save All to Database
                        </button>
                    </div>

                    <div className="questions-list">
                        {generatedQuestions.map((q, index) => (
                            <div key={index} className="question-card card-glass mb-md">
                                <div className="flex justify-between items-start mb-sm">
                                    <h3>Question {index + 1}</h3>
                                    <span className={`badge badge-${q.difficulty?.toLowerCase() || 'medium'}`}>
                                        {q.difficulty || 'Medium'}
                                    </span>
                                </div>

                                <p className="mb-md"><strong>Q:</strong> {q.question || q.title || q.description}</p>

                                {q.options && (
                                    <div className="options-list mb-md">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className={`option ${opt === q.answer ? 'correct' : ''}`}>
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {q.answer && (
                                    <p className="mb-sm"><strong>✅ Answer:</strong> {q.answer}</p>
                                )}

                                {q.explanation && (
                                    <p className="text-muted"><strong>💡 Explanation:</strong> {q.explanation}</p>
                                )}

                                {q.constraints && (
                                    <div className="code-block mb-sm bg-darker p-sm rounded">
                                        <strong>⚠️ Constraints:</strong>
                                        <pre>{q.constraints}</pre>
                                    </div>
                                )}

                                {q.inputFormat && (
                                    <div className="grid grid-2 gap-md mb-sm">
                                        <div>
                                            <strong>📥 Input Format:</strong>
                                            <p className="text-sm text-muted">{q.inputFormat}</p>
                                        </div>
                                        <div>
                                            <strong>📤 Output Format:</strong>
                                            <p className="text-sm text-muted">{q.outputFormat}</p>
                                        </div>
                                    </div>
                                )}

                                {q.sampleInput && (
                                    <div className="code-block mb-sm">
                                        <strong>Sample Input:</strong>
                                        <pre>{q.sampleInput}</pre>
                                    </div>
                                )}

                                {q.sampleOutput && (
                                    <div className="code-block mb-md">
                                        <strong>Sample Output:</strong>
                                        <pre>{q.sampleOutput}</pre>
                                    </div>
                                )}

                                {/* Test Case Editor section for Coding questions */}
                                {(q.category === 'DSA' || activeTab === 'coding' || activeTab === 'mixed') && (
                                    <div className="test-cases-section mt-md border-t pt-md">
                                        <h4 className="mb-sm">Test Cases ({q.testCases?.length || 0})</h4>
                                        <p className="text-sm text-muted mb-sm">First 2-3 are usually public. Hidden test cases validate edge cases.</p>

                                        <div className="test-cases-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {(q.testCases || []).map((tc, tcIndex) => (
                                                <div key={tcIndex} className={`test-case-row grid grid-3 gap-sm mb-sm items-center p-xs rounded ${tc.isHidden ? 'bg-error-light' : 'bg-success-light'}`}>
                                                    <input
                                                        className="input input-sm"
                                                        placeholder="Input"
                                                        value={tc.input}
                                                        onChange={(e) => {
                                                            const newQuestions = [...generatedQuestions];
                                                            if (!newQuestions[index].testCases) newQuestions[index].testCases = [];
                                                            newQuestions[index].testCases[tcIndex].input = e.target.value;
                                                            setGeneratedQuestions(newQuestions);
                                                        }}
                                                    />
                                                    <input
                                                        className="input input-sm"
                                                        placeholder="Expected Output"
                                                        value={tc.expectedOutput}
                                                        onChange={(e) => {
                                                            const newQuestions = [...generatedQuestions];
                                                            newQuestions[index].testCases[tcIndex].expectedOutput = e.target.value;
                                                            setGeneratedQuestions(newQuestions);
                                                        }}
                                                    />
                                                    <div className="flex items-center gap-sm">
                                                        <label className="flex items-center gap-xs text-sm cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={tc.isHidden}
                                                                onChange={(e) => {
                                                                    const newQuestions = [...generatedQuestions];
                                                                    newQuestions[index].testCases[tcIndex].isHidden = e.target.checked;
                                                                    setGeneratedQuestions(newQuestions);
                                                                }}
                                                            />
                                                            Hidden
                                                        </label>
                                                        <button
                                                            className="btn btn-xs btn-danger"
                                                            onClick={() => {
                                                                const newQuestions = [...generatedQuestions];
                                                                newQuestions[index].testCases.splice(tcIndex, 1);
                                                                setGeneratedQuestions(newQuestions);
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            className="btn btn-sm btn-outline mt-sm"
                                            onClick={() => {
                                                const newQuestions = [...generatedQuestions];
                                                if (!newQuestions[index].testCases) newQuestions[index].testCases = [];
                                                newQuestions[index].testCases.push({ input: '', expectedOutput: '', isHidden: true });
                                                setGeneratedQuestions(newQuestions);
                                            }}
                                        >
                                            + Add Test Case
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
