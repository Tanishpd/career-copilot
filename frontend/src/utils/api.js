import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile')
};

// Admin API
export const adminAPI = {
    // Questions
    createQuestion: (data) => api.post('/admin/questions', data),
    getAllQuestions: (params) => api.get('/admin/questions', { params }),
    updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data),
    deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),

    // Sessions
    createSession: (data) => api.post('/admin/sessions', data),
    getAllSessions: () => api.get('/admin/sessions'),
    getSessionDetails: (id) => api.get(`/admin/sessions/${id}`),

    // Results
    getAllResults: () => api.get('/admin/results'),
    getResultDetails: (id) => api.get(`/admin/results/${id}`),
    getRankings: (params) => api.get('/admin/rankings', { params }),

    // AI Generation
    generateAptitudeQuestions: (data) => api.post('/admin/generate-aptitude', data),
    generateCodingQuestions: (data) => api.post('/admin/generate-coding', data)
};

// Candidate API
export const candidateAPI = {
    getActiveSession: () => api.get('/candidate/session'),
    startSession: () => api.post('/candidate/session/start'),
    finishSession: () => api.post('/candidate/session/finish'),
    saveProgress: (data) => api.post('/candidate/session/save', data),
    getResults: () => api.get('/candidate/results'),
    getQuestion: (questionId) => api.get(`/candidate/question/${questionId}`),
    submitCode: (data) => api.post('/candidate/submit', data),
    runCode: (data) => api.post('/candidate/run', data),
    getFeedback: (submissionId) => api.get(`/candidate/feedback/${submissionId}`),
    requestHint: (data) => api.post('/candidate/hint', data),
    logViolation: (data) => api.post('/candidate/log-violation', data),

    // Resume
    saveResume: (data) => api.post('/candidate/resume/save', data), // data: { id?, title, data }
    getResumes: () => api.get('/candidate/resume/list'),
    getResume: (id) => api.get(`/candidate/resume/${id}`),
    deleteResume: (id) => api.delete(`/candidate/resume/${id}`),
    generateResumeSuggestions: (data) => api.post('/candidate/resume/suggest', data)
};

export default api;
