import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { QuestionManager } from './pages/admin/QuestionManager';
import { SessionCreator } from './pages/admin/SessionCreator';
import { SessionDetail } from './pages/admin/SessionDetail';
import { ResultsViewer } from './pages/admin/ResultsViewer';
import { ResultDetail } from './pages/admin/ResultDetail';
import { RankingDashboard } from './pages/admin/RankingDashboard';
import { ExamGenerator } from './pages/admin/ExamGenerator';
import { ExamInterface } from './pages/candidate/ExamInterface';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { ExamResults } from './pages/candidate/ExamResults';

import { ResumeBuilder } from './pages/candidate/ResumeBuilder';
import { ResumeATS } from './pages/candidate/ResumeATS';
import { PracticeCoding } from './pages/candidate/PracticeCoding';
import './index.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Admin Routes */}
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/questions"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <QuestionManager />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/sessions"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <SessionCreator />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/sessions/:id"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <SessionDetail />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/results"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <ResultsViewer />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/results/:id"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <ResultDetail />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/rankings"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <RankingDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/generate"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <ExamGenerator />
                            </ProtectedRoute>
                        }
                    />

                    {/* Candidate Routes */}
                    <Route
                        path="/candidate/dashboard"
                        element={
                            <ProtectedRoute requiredRole="candidate">
                                <CandidateDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/candidate/exam"
                        element={
                            <ProtectedRoute requiredRole="candidate">
                                <ExamInterface />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/candidate/results"
                        element={
                            <ProtectedRoute requiredRole="candidate">
                                <ExamResults />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/candidate/resume-builder"
                        element={
                            <ProtectedRoute requiredRole="candidate">
                                <ResumeBuilder />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/candidate/resume-ats"
                        element={
                            <ProtectedRoute requiredRole="candidate">
                                <ResumeATS />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/candidate/practice"
                        element={
                            <ProtectedRoute requiredRole="candidate">
                                <PracticeCoding />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
