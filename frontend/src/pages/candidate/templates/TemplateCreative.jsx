import React from 'react';

export const TemplateCreative = ({ resumeData }) => {
    const { personalInfo, education, experience, skills, projects, settings } = resumeData;

    // Grid layout for sidebar
    const layoutStyle = {
        display: 'grid',
        gridTemplateColumns: '30% 70%',
        minHeight: '297mm', // Full A4 height
        fontSize: settings.fontSize === 'small' ? '0.9rem' : settings.fontSize === 'large' ? '1.1rem' : '1rem',
        lineHeight: settings.spacing
    };

    const sidebarStyle = {
        background: settings.themeColor,
        color: 'white',
        padding: '20px'
    };

    const mainStyle = {
        padding: '20px',
        background: 'white'
    };

    return (
        <div id="resume-content" className="resume-paper shadow-lg a4-size" style={{ ...layoutStyle, padding: 0 }}>
            {/* Sidebar */}
            <div style={sidebarStyle}>
                <div className="mb-xl text-center">
                    {/* Placeholder for Photo if added later */}
                    <div className="w-32 h-32 bg-white/20 rounded-full mx-auto mb-md flex items-center justify-center text-4xl">
                        👤
                    </div>
                    <h2 className="text-xl font-bold mb-xs break-words">{personalInfo.fullName}</h2>
                    <div className="text-sm opacity-90">{personalInfo.email}</div>
                    <div className="text-sm opacity-90">{personalInfo.phone}</div>
                </div>

                {settings.visibleSections.skills && skills.length > 0 && (
                    <div className="mb-xl">
                        <h3 className="font-bold border-b border-white/30 mb-md pb-1">SKILLS</h3>
                        <div className="flex flex-wrap gap-xs">
                            {skills.map((skill, idx) => (
                                <span key={idx} className="bg-white/10 px-2 py-1 rounded text-sm mb-xs block w-full">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {settings.visibleSections.education && education.length > 0 && (
                    <div className="mb-xl">
                        <h3 className="font-bold border-b border-white/30 mb-md pb-1">EDUCATION</h3>
                        {education.map(edu => (
                            <div key={edu.id} className="mb-md text-sm">
                                <div className="font-bold">{edu.degree}</div>
                                <div>{edu.school}</div>
                                <div className="opacity-75">{edu.year}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div style={mainStyle}>
                <div className="mb-lg">
                    <h1 className="text-3xl font-bold text-gray-800 mb-sm" style={{ color: settings.themeColor }}>Profile</h1>
                    <p className="text-gray-600">{personalInfo.summary}</p>
                </div>

                {settings.visibleSections.experience && experience.length > 0 && (
                    <div className="mb-xl">
                        <h2 className="text-xl font-bold border-b-2 mb-md pb-2" style={{ borderColor: settings.themeColor, color: settings.themeColor }}>Work Experience</h2>
                        {experience.map(exp => (
                            <div key={exp.id} className="mb-lg">
                                <h3 className="font-bold text-lg">{exp.role}</h3>
                                <div className="text-gray-500 mb-xs flex justify-between">
                                    <span className="font-semibold">{exp.company}</span>
                                    <span>{exp.duration}</span>
                                </div>
                                <p className="text-gray-700">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {settings.visibleSections.projects && projects.length > 0 && (
                    <div className="mb-xl">
                        <h2 className="text-xl font-bold border-b-2 mb-md pb-2" style={{ borderColor: settings.themeColor, color: settings.themeColor }}>Projects</h2>
                        {projects.map(proj => (
                            <div key={proj.id} className="mb-lg">
                                <h3 className="font-bold">{proj.title}</h3>
                                {proj.link && <a href={proj.link} className="text-sm text-blue-500 mb-xs block">{proj.link}</a>}
                                <p className="text-gray-700">{proj.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
