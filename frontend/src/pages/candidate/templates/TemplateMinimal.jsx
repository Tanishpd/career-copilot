import React from 'react';

export const TemplateMinimal = ({ resumeData }) => {
    const { personalInfo, education, experience, skills, projects, settings } = resumeData;

    const themeStyle = {
        '--resume-accent': settings.themeColor,
        fontSize: settings.fontSize === 'small' ? '0.9rem' : settings.fontSize === 'large' ? '1.1rem' : '1rem',
        lineHeight: settings.spacing,
        fontFamily: 'Times New Roman, Serif' // Enforce serif for minimal
    };

    return (
        <div id="resume-content" className="resume-paper bg-white shadow-lg a4-size" style={themeStyle}>
            <div className="text-center mb-xl">
                <h1 className="text-3xl font-serif text-gray-900 mb-xs">{personalInfo.fullName}</h1>
                <div className="text-sm text-gray-600 space-x-2">
                    {personalInfo.email && <span>{personalInfo.email}</span>}
                    {personalInfo.phone && <span>| {personalInfo.phone}</span>}
                    {personalInfo.linkedin && <span>| {personalInfo.linkedin}</span>}
                </div>
            </div>

            {/* Sections in simple vertical list */}
            <div className="space-y-lg">
                {personalInfo.summary && (
                    <div className="section">
                        <h3 className="font-bold border-b border-gray-300 mb-sm pb-1">SUMMARY</h3>
                        <p>{personalInfo.summary}</p>
                    </div>
                )}

                {settings.visibleSections.experience && experience.length > 0 && (
                    <div className="section">
                        <h3 className="font-bold border-b border-gray-300 mb-sm pb-1">EXPERIENCE</h3>
                        {experience.map(exp => (
                            <div key={exp.id} className="mb-md">
                                <div className="flex justify-between font-bold">
                                    <span>{exp.role}</span>
                                    <span>{exp.duration}</span>
                                </div>
                                <div className="italic mb-xs">{exp.company}</div>
                                <p>{exp.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add other sections similarly */}
                {settings.visibleSections.education && education.length > 0 && (
                    <div className="section">
                        <h3 className="font-bold border-b border-gray-300 mb-sm pb-1">EDUCATION</h3>
                        {education.map(edu => (
                            <div key={edu.id} className="mb-md">
                                <div className="flex justify-between font-bold">
                                    <span>{edu.school}</span>
                                    <span>{edu.year}</span>
                                </div>
                                <div>{edu.degree}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
