import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useResume } from '../../context/ResumeContext';
import { getResumeSuggestions } from '../../services/aiResumeService';
import { candidateAPI } from '../../utils/api';
import { RichTextEditor } from '../../components/RichTextEditor';

export const ResumeEditor = () => {
    const { resumeData, setResumeData, updatePersonalInfo, updateSettings, addItem, updateItem, deleteItem, updateSkills, reorderSection } = useResume();
    const [activeSection, setActiveSection] = useState('personal');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const resumeId = searchParams.get('id');

    // Resume Metadata State
    const [resumeTitle, setResumeTitle] = useState('My Resume');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // AI State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [targetField, setTargetField] = useState(null); // { section, id, field }

    // Load Resume if ID exists
    useEffect(() => {
        if (resumeId) {
            loadResume(resumeId);
        }
    }, [resumeId]);

    const loadResume = async (id) => {
        try {
            const response = await candidateAPI.getResume(id);
            if (response.data.success) {
                const { title, data } = response.data.data.resume;
                setResumeTitle(title);
                setResumeData(data); // Hydrate context
            }
        } catch (error) {
            console.error('Failed to load resume', error);
            alert('Failed to load resume');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            const payload = {
                id: resumeId, // If null, backend creates new
                title: resumeTitle,
                data: resumeData
            };
            const response = await candidateAPI.saveResume(payload);
            if (response.data.success) {
                setSaveMessage('Saved successfully!');
                const savedResume = response.data.data.resume;
                // If it was a new resume, update URL with ID
                if (!resumeId) {
                    navigate(`/candidate/resume-builder?id=${savedResume._id}`, { replace: true });
                }
            }
        } catch (error) {
            console.error('Save failed', error);
            setSaveMessage('Save failed. Try again.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    const handleAiSuggest = async (section, content, target) => {
        setTargetField(target);
        setShowAiModal(true);
        setAiLoading(true);
        setAiSuggestions([]);

        const suggestions = await getResumeSuggestions(section, content);
        setAiSuggestions(suggestions);
        setAiLoading(false);
    };

    const applySuggestion = (text) => {
        if (targetField.section === 'personal') {
            updatePersonalInfo(targetField.field, text);
        } else if (targetField.id) {
            updateItem(targetField.section, targetField.id, targetField.field, text);
        }
        setShowAiModal(false);
    };

    const sections = [
        { id: 'personal', label: 'Personal Details', icon: '👤' },
        { id: 'education', label: 'Education', icon: '🎓' },
        { id: 'experience', label: 'Experience', icon: '💼' },
        { id: 'skills', label: 'Skills', icon: '⚡' },
        { id: 'projects', label: 'Projects', icon: '🚀' }
    ];

    return (
        <div className="resume-editor">
            {/* Toolbar */}
            <div className="p-md border-b bg-white flex justify-between items-center sticky top-0 z-20">
                <input
                    type="text"
                    value={resumeTitle}
                    onChange={(e) => setResumeTitle(e.target.value)}
                    className="text-lg font-bold border-none focus:ring-0 text-gray-800 w-full mr-4"
                    placeholder="Resume Name..."
                />
                <div className="flex items-center gap-sm">
                    {saveMessage && <span className="text-sm text-green-600 animate-pulse">{saveMessage}</span>}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn btn-primary btn-sm flex items-center gap-2"
                    >
                        {isSaving ? 'Saving...' : '💾 Save'}
                    </button>
                    <button onClick={() => navigate('/candidate/dashboard')} className="btn btn-outline-secondary btn-sm">
                        Exit
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="editor-nav">
                {sections.map(section => (
                    <button
                        key={section.id}
                        className={`nav-btn ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(section.id)}
                    >
                        <span className="icon">{section.icon}</span>
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Form Content */}
            <div className="editor-content scroll-y">
                {activeSection === 'personal' && (
                    <div className="form-section">
                        <h3>Personal Details</h3>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="input"
                                value={resumeData.personalInfo.fullName}
                                onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="input"
                                value={resumeData.personalInfo.email}
                                onChange={(e) => updatePersonalInfo('email', e.target.value)}
                                placeholder="e.g. john@example.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="text"
                                className="input"
                                value={resumeData.personalInfo.phone}
                                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                                placeholder="e.g. +1 234 567 8900"
                            />
                        </div>
                        <div className="form-group">
                            <label className="flex justify-between">
                                Professional Summary
                                <button
                                    className="text-xs text-indigo-600 font-bold hover:underline"
                                    onClick={() => handleAiSuggest('Professional Summary', resumeData.personalInfo.summary, { section: 'personal', field: 'summary' })}
                                >
                                    ✨ Write for me
                                </button>
                            </label>
                            <textarea
                                className="input"
                                rows="4"
                                value={resumeData.personalInfo.summary}
                                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                                placeholder="Brief overview of your career..."
                            />
                        </div>
                        <div className="grid grid-2 gap-md">
                            <div className="form-group">
                                <label>LinkedIn</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={resumeData.personalInfo.linkedin}
                                    onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>GitHub</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={resumeData.personalInfo.github}
                                    onChange={(e) => updatePersonalInfo('github', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'education' && (
                    <div className="form-section">
                        <div className="flex justify-between items-center mb-md">
                            <h3>Education</h3>
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={() => addItem('education', { school: '', degree: '', year: '', score: '' })}
                            >
                                + Add
                            </button>
                        </div>
                        {resumeData.education.map((edu, idx) => (
                            <div key={edu.id} className="card p-md mb-md bg-secondary">
                                <div className="flex justify-between mb-sm">
                                    <strong>Education #{idx + 1}</strong>
                                    <button className="text-danger" onClick={() => deleteItem('education', edu.id)}>🗑️</button>
                                </div>
                                <div className="form-group">
                                    <input
                                        className="input mb-sm"
                                        placeholder="School / University"
                                        value={edu.school}
                                        onChange={(e) => updateItem('education', edu.id, 'school', e.target.value)}
                                    />
                                    <input
                                        className="input mb-sm"
                                        placeholder="Degree"
                                        value={edu.degree}
                                        onChange={(e) => updateItem('education', edu.id, 'degree', e.target.value)}
                                    />
                                    <div className="flex gap-sm">
                                        <input
                                            className="input"
                                            placeholder="Year"
                                            value={edu.year}
                                            onChange={(e) => updateItem('education', edu.id, 'year', e.target.value)}
                                        />
                                        <input
                                            className="input"
                                            placeholder="Grade/Score"
                                            value={edu.score}
                                            onChange={(e) => updateItem('education', edu.id, 'score', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Placeholder for other sections */}
                {activeSection === 'experience' && (
                    <div className="form-section">
                        <div className="flex justify-between items-center mb-md">
                            <h3>Experience</h3>
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={() => addItem('experience', { company: '', role: '', duration: '', description: '' })}
                            >
                                + Add
                            </button>
                        </div>
                        {resumeData.experience.map((exp, idx) => (
                            <div key={exp.id} className="card p-md mb-md bg-secondary">
                                <div className="flex justify-between mb-sm">
                                    <strong>Role #{idx + 1}</strong>
                                    <button className="text-danger" onClick={() => deleteItem('experience', exp.id)}>🗑️</button>
                                </div>
                                <div className="form-group">
                                    <input
                                        className="input mb-sm"
                                        placeholder="Company"
                                        value={exp.company}
                                        onChange={(e) => updateItem('experience', exp.id, 'company', e.target.value)}
                                    />
                                    <input
                                        className="input mb-sm"
                                        placeholder="Job Role"
                                        value={exp.role}
                                        onChange={(e) => updateItem('experience', exp.id, 'role', e.target.value)}
                                    />
                                    <input
                                        className="input mb-sm"
                                        placeholder="Duration (e.g. 2020 - Present)"
                                        value={exp.duration}
                                        onChange={(e) => updateItem('experience', exp.id, 'duration', e.target.value)}
                                    />
                                    <label className="flex justify-between mt-sm mb-xs text-sm">
                                        Description
                                        <button
                                            className="text-xs text-indigo-600 font-bold hover:underline"
                                            onClick={() => handleAiSuggest('Job Description', exp.description, { section: 'experience', id: exp.id, field: 'description' })}
                                        >
                                            ✨ Improve
                                        </button>
                                    </label>
                                    <textarea
                                        className="input"
                                        rows="3"
                                        placeholder="Description of responsibilities..."
                                        value={exp.description}
                                        onChange={(e) => updateItem('experience', exp.id, 'description', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeSection === 'skills' && (
                    <div className="form-section">
                        <h3>Skills</h3>
                        <p className="text-muted text-sm mb-md">Comma separated skills</p>
                        <textarea
                            className="input"
                            rows="4"
                            value={resumeData.skills.join(', ')}
                            onChange={(e) => updateSkills(e.target.value.split(',').map(s => s.trim()))}
                            placeholder="JavaScript, React, Node.js..."
                        />
                    </div>
                )}

                {activeSection === 'projects' && (
                    <div className="form-section">
                        <div className="flex justify-between items-center mb-md">
                            <h3>Projects</h3>
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={() => addItem('projects', { title: '', description: '', link: '' })}
                            >
                                + Add
                            </button>
                        </div>
                        {resumeData.projects.map((proj, idx) => (
                            <div key={proj.id} className="card p-md mb-md bg-secondary">
                                <div className="flex justify-between mb-sm">
                                    <strong>Project #{idx + 1}</strong>
                                    <button className="text-danger" onClick={() => deleteItem('projects', proj.id)}>🗑️</button>
                                </div>
                                <div className="form-group">
                                    <input
                                        className="input mb-sm"
                                        placeholder="Project Title"
                                        value={proj.title}
                                        onChange={(e) => updateItem('projects', proj.id, 'title', e.target.value)}
                                    />
                                    <input
                                        className="input mb-sm"
                                        placeholder="Link (Optional)"
                                        value={proj.link}
                                        onChange={(e) => updateItem('projects', proj.id, 'link', e.target.value)}
                                    />
                                    <textarea
                                        className="input"
                                        rows="3"
                                        placeholder="Project Description..."
                                        value={proj.description}
                                        onChange={(e) => updateItem('projects', proj.id, 'description', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* AI Modal */}
            {showAiModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-lg rounded-lg shadow-xl max-w-lg w-full">
                        <h3 className="text-xl font-bold mb-md flex justify-between">
                            <span>✨ AI Suggestions</span>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-500 hover:text-red-500">✕</button>
                        </h3>

                        {aiLoading ? (
                            <div className="text-center py-xl">
                                <div className="animate-spin text-4xl mb-sm">✨</div>
                                <p>Generating magic...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-md max-h-96 overflow-y-auto">
                                {aiSuggestions.map((sugg, idx) => (
                                    <div
                                        key={idx}
                                        className="p-md border rounded hover:bg-indigo-50 cursor-pointer transition-colors"
                                        onClick={() => applySuggestion(sugg)}
                                    >
                                        {sugg}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-md text-right">
                            <button className="btn btn-outline-secondary" onClick={() => setShowAiModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
