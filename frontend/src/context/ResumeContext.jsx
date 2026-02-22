import React, { createContext, useContext, useState, useEffect } from 'react';

const ResumeContext = createContext();

export const useResume = () => useContext(ResumeContext);

const initialResumeState = {
    personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        linkedin: '',
        github: '',
        summary: ''
    },
    education: [
        // { id: 1, school: '', degree: '', year: '', score: '' }
    ],
    experience: [
        // { id: 1, company: '', role: '', duration: '', description: '' }
    ],
    skills: [], // Array of strings
    projects: [
        // { id: 1, title: '', description: '', technologies: '', link: '' }
    ],
    certifications: [],
    achievements: [],
    settings: {
        themeColor: '#4f46e5', // Indigo-600
        fontFamily: 'Inter',
        fontSize: 'medium', // small, medium, large
        templateId: 'modern', // modern, minimal, creative
        spacing: 1.0, // 0.8 to 1.5
        sectionOrder: ['summary', 'education', 'experience', 'skills', 'projects'],
        visibleSections: {
            education: true,
            experience: true,
            skills: true,
            projects: true,
            certifications: false,
            achievements: false
        }
    }
};

export const ResumeProvider = ({ children }) => {
    // Attempt to load from localStorage first
    const [resumeData, setResumeData] = useState(() => {
        const saved = localStorage.getItem('resumeDraft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Deep merge to ensure new fields (like settings.visibleSections) are present
                return {
                    ...initialResumeState,
                    ...parsed,
                    settings: {
                        ...initialResumeState.settings,
                        ...(parsed.settings || {})
                    }
                };
            } catch (e) {
                console.error("Failed to parse resume draft", e);
                return initialResumeState;
            }
        }
        return initialResumeState;
    });

    // Auto-save to localStorage
    useEffect(() => {
        localStorage.setItem('resumeDraft', JSON.stringify(resumeData));
    }, [resumeData]);

    const updatePersonalInfo = (field, value) => {
        setResumeData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, [field]: value }
        }));
    };

    const updateSettings = (field, value) => {
        setResumeData(prev => ({
            ...prev,
            settings: { ...prev.settings, [field]: value }
        }));
    };

    // Generic list helpers
    const addItem = (section, item) => {
        setResumeData(prev => ({
            ...prev,
            [section]: [...prev[section], { ...item, id: Date.now() }]
        }));
    };

    const updateItem = (section, id, field, value) => {
        setResumeData(prev => ({
            ...prev,
            [section]: prev[section].map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const deleteItem = (section, id) => {
        setResumeData(prev => ({
            ...prev,
            [section]: prev[section].filter(item => item.id !== id)
        }));
    };

    const updateSkills = (skillsArray) => {
        setResumeData(prev => ({
            ...prev,
            skills: skillsArray
        }));
    };

    const reorderSection = (fromIndex, toIndex) => {
        setResumeData(prev => {
            const newOrder = [...prev.settings.sectionOrder];
            const [moved] = newOrder.splice(fromIndex, 1);
            newOrder.splice(toIndex, 0, moved);
            return {
                ...prev,
                settings: { ...prev.settings, sectionOrder: newOrder }
            };
        });
    };

    return (
        <ResumeContext.Provider value={{
            resumeData,
            setResumeData,
            updatePersonalInfo,
            updateSettings,
            addItem,
            updateItem,
            deleteItem,
            updateSkills,
            reorderSection
        }}>
            {children}
        </ResumeContext.Provider>
    );
};
