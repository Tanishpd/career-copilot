import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';

export const QuestionManager = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'DSA',
        difficulty: 'Medium',
        constraints: '',
        inputFormat: '',
        outputFormat: '',
        sampleInput: '',
        sampleOutput: ''
    });

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            const response = await adminAPI.getAllQuestions();
            setQuestions(response.data.data.questions);
        } catch (error) {
            console.error('Error loading questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.createQuestion(formData);
            setShowForm(false);
            setFormData({
                title: '',
                description: '',
                category: 'DSA',
                difficulty: 'Medium',
                constraints: '',
                inputFormat: '',
                outputFormat: '',
                sampleInput: '',
                sampleOutput: ''
            });
            loadQuestions();
        } catch (error) {
            console.error('Error creating question:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                await adminAPI.deleteQuestion(id);
                loadQuestions();
            } catch (error) {
                console.error('Error deleting question:', error);
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
            <div className="dashboard-header flex justify-between items-center">
                <div>
                    <h1>Question Manager</h1>
                    <p className="text-muted">Create and manage coding questions</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    {showForm ? 'Cancel' : '+ Add Question'}
                </button>
            </div>

            {showForm && (
                <div className="card mb-xl">
                    <h2>Create New Question</h2>
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Category</label>
                                <select
                                    className="input"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="DSA">DSA</option>
                                    <option value="SQL">SQL</option>
                                    <option value="Debugging">Debugging</option>
                                    <option value="System Design">System Design</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Difficulty</label>
                            <select
                                className="input"
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="label">Description</label>
                            <textarea
                                className="input"
                                rows="5"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary">Create Question</button>
                    </form>
                </div>
            )}

            <div className="grid grid-2">
                {questions.map((question) => (
                    <div key={question._id} className="card">
                        <div className="flex justify-between items-start mb-md">
                            <div>
                                <h3>{question.title}</h3>
                                <div className="flex gap-sm mt-sm">
                                    <span className={`badge badge-${question.difficulty.toLowerCase()}`}>
                                        {question.difficulty}
                                    </span>
                                    <span className="badge badge-primary">{question.category}</span>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(question._id)} className="btn btn-danger btn-sm">
                                Delete
                            </button>
                        </div>
                        <p className="text-muted">{question.description.substring(0, 150)}...</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
