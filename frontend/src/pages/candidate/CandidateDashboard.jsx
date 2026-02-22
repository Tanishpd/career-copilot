import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { candidateAPI } from '../../utils/api';
import { monitoringService } from '../../utils/monitoringService';
import './CandidateDashboard.css';

export const CandidateDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [examStatus, setExamStatus] = useState('loading'); // loading, no-exam, scheduled, active, expired
    const [permissions, setPermissions] = useState({
        camera: false,
        microphone: false,
        fullscreen: false
    });
    const [permissionStep, setPermissionStep] = useState(0); // 0: None, 1: Check Cam/Mic, 2: Fullscreen, 3: Completed
    const [startError, setStartError] = useState('');

    const [resumes, setResumes] = useState([]);

    useEffect(() => {
        loadSession();
        loadResumes();
    }, []);

    const loadResumes = async () => {
        try {
            const response = await candidateAPI.getResumes();
            if (response.data.success) {
                setResumes(response.data.data.resumes);
            }
        } catch (error) {
            console.error('Error loading resumes:', error);
        }
    };

    const handleDeleteResume = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this resume?')) return;

        try {
            await candidateAPI.deleteResume(id);
            // Optimistic update or reload
            setResumes(prev => prev.filter(r => r._id !== id));
        } catch (error) {
            console.error('Error deleting resume:', error);
            alert('Failed to delete resume');
        }
    };

    const loadSession = async () => {
        try {
            const response = await candidateAPI.getActiveSession();
            // Assuming API returns { success: true, data: { session: ... } }
            // Adjust based on your API response structure if needed. 
            // Previous code shows candidateAPI.getActiveSession() returning the session directly or nested.
            // Let's assume consistent response wrapper.
            const sessionData = response.data.data?.session;

            if (sessionData) {
                setSession(sessionData);
                checkStatus(sessionData);
            } else {
                setExamStatus('no-exam');
            }
        } catch (error) {
            console.error('Error loading session:', error);
            // If 404, valid no-exam state
            if (error.response?.status === 404) {
                setExamStatus('no-exam');
            } else {
                setStartError('Failed to load exam details.');
            }
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = (sessionData) => {
        const now = new Date();
        const startTime = new Date(sessionData.schedule?.startTime || Date.now()); // Fallback if not scheduled
        const endTime = sessionData.schedule?.endTime ? new Date(sessionData.schedule.endTime) : null;

        if (sessionData.status === 'completed') {
            setExamStatus('completed');
            return;
        }

        if (sessionData.status === 'expired' || (endTime && now > endTime)) {
            setExamStatus('expired');
            return;
        }

        // Allow start 10 mins before
        const timeDiff = startTime - now;
        const tenMinutes = 10 * 60 * 1000;

        if (timeDiff > tenMinutes) {
            setExamStatus('scheduled'); // Too early
        } else {
            setExamStatus('active'); // Ready to start
        }
    };

    const startPermissionCheck = () => {
        setPermissionStep(1);
    };

    const requestMediaPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (stream) {
                setPermissions(prev => ({ ...prev, camera: true, microphone: true }));

                // Stop tracks to release camera until actual exam
                stream.getTracks().forEach(track => track.stop());
                setPermissionStep(2);
            }
        } catch (error) {
            console.error('Media permission denied:', error);
            setStartError('Camera and Microphone access is required to start the exam.');
        }
    };

    const requestFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setPermissions(prev => ({ ...prev, fullscreen: true }));
            setPermissionStep(3);

            // Wait a moment for state update then navigate
            setTimeout(() => {
                navigate('/candidate/exam');
            }, 1000);
        } catch (error) {
            console.error('Fullscreen denied:', error);
            setStartError('Fullscreen mode is required to start the exam.');
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Welcome, {user?.name}</h1>
                <p className="text-muted">Prepare for your upcoming assessment</p>
            </header>

            <div className="exam-card-container">
                {examStatus === 'no-exam' && (
                    <div className="card text-center">
                        <h2>No Exams Scheduled</h2>
                        <p>You don't have any pending exams at the moment.</p>
                    </div>
                )}

                {examStatus === 'completed' && (
                    <div className="card text-center">
                        <h2>Exam Completed</h2>
                        <p>You have successfully submitted your exam.</p>
                    </div>
                )}

                {(examStatus === 'scheduled' || examStatus === 'active') && session && (
                    <div className="card card-glass exam-card">
                        <div className="flex justify-between items-center mb-md">
                            <div>
                                <span className="badge badge-primary mb-sm">Coding Assessment</span>
                                <h2>{session.title || 'Technical Assessment'}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-large font-bold">
                                    {new Date(session.schedule?.startTime).toLocaleDateString()}
                                </p>
                                <p className="text-muted">
                                    {new Date(session.schedule?.startTime).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>

                        <div className="exam-details grid grid-3 gap-md mb-xl">
                            <div className="detail-item">
                                <h3>Duration</h3>
                                <p>{session.schedule?.duration || 60} Minutes</p>
                            </div>
                            <div className="detail-item">
                                <h3>Questions</h3>
                                <p>{session.assignedQuestions?.length || 0} Questions</p>
                            </div>
                            <div className="detail-item">
                                <h3>Status</h3>
                                <p className={`status-${examStatus}`}>
                                    {examStatus === 'scheduled' ? 'Scheduled' : 'Ready to Start'}
                                </p>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="exam-actions border-t pt-md">
                            {startError && (
                                <div className="alert alert-danger mb-md">
                                    {startError}
                                </div>
                            )}

                            {permissionStep === 0 && (
                                <button
                                    className="btn btn-primary btn-lg btn-block"
                                    onClick={startPermissionCheck}
                                    disabled={examStatus === 'scheduled'}
                                >
                                    {examStatus === 'scheduled'
                                        ? `Available at ${new Date(session.schedule?.startTime).toLocaleTimeString()}`
                                        : 'Start Exam'}
                                </button>
                            )}

                            {permissionStep === 1 && (
                                <div className="permission-check">
                                    <h3>Step 1: System Check</h3>
                                    <p className="mb-md">We need to check your camera and microphone.</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={requestMediaPermissions}
                                    >
                                        Enable Camera & Microphone
                                    </button>
                                </div>
                            )}

                            {permissionStep === 2 && (
                                <div className="permission-check">
                                    <h3>Step 2: Secure Environment</h3>
                                    <p className="mb-md">The exam must be taken in fullscreen mode.</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={requestFullscreen}
                                    >
                                        Enter Fullscreen to Start
                                    </button>
                                </div>
                            )}

                            {permissionStep === 3 && (
                                <div className="text-center text-success">
                                    <h3>All Checks Passed!</h3>
                                    <p>Redirecting to exam...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className="features-grid grid grid-3 gap-lg mt-xl">
                    {/* Resume Builder Card */}
                    <div className="card feature-card clickable-card" onClick={() => navigate('/candidate/resume-builder')}>
                        <div className="feature-icon mb-md">📝</div>
                        <h3>Resume Builder</h3>
                        <p className="text-muted">Create a professional resume with AI assistance.</p>
                    </div>

                    {/* ATS Checker Card */}
                    <div className="card feature-card clickable-card" onClick={() => navigate('/candidate/resume-ats')}>
                        <div className="feature-icon mb-md">🎯</div>
                        <h3>Resume ATS Checker</h3>
                        <p className="text-muted">Optimize your resume for Applicant Tracking Systems.</p>
                    </div>

                    {/* Practice Coding Card */}
                    <div className="card feature-card clickable-card" onClick={() => navigate('/candidate/practice')}>
                        <div className="feature-icon mb-md">💻</div>
                        <h3>Practice Coding</h3>
                        <p className="text-muted">Solve problems to improve your coding skills.</p>
                    </div>
                </div>

                {/* Saved Resumes Section */}
                {resumes.length > 0 && (
                    <div className="mt-xl animate-fade-in">
                        <h2 className="text-xl font-bold mb-md">Your Resumes</h2>
                        <div className="grid grid-3 gap-lg">
                            {resumes.map(resume => (
                                <div key={resume._id} className="card p-md hover:shadow-lg transition-all relative group border-l-4 border-indigo-500">
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/candidate/resume-builder?id=${resume._id}`)}
                                    >
                                        <div className="flex justify-between items-start mb-sm">
                                            <div className="text-2xl">📄</div>
                                            <div className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                {new Date(resume.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold mb-xs text-gray-800 truncate">{resume.title}</h3>
                                        <p className="text-sm text-muted">Click to edit</p>
                                    </div>
                                    <button
                                        className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => handleDeleteResume(e, resume._id)}
                                        title="Delete Resume"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
