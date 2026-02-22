import React from 'react';

export const TemplateModern = ({ resumeData }) => {
    const { personalInfo, education, experience, skills, projects, settings } = resumeData;

    // Derived styles
    const themeStyle = {
        '--resume-accent': settings.themeColor,
        fontSize: settings.fontSize === 'small' ? '0.9rem' : settings.fontSize === 'large' ? '1.1rem' : '1rem',
        lineHeight: settings.spacing
    };

    return (
        <div id="resume-content" className="resume-paper bg-white shadow-lg a4-size" style={themeStyle}>
            {/* Header */}
            <div className="resume-header mb-lg border-b-2 border-accent pb-md">
                <h1 className="text-2xl font-bold text-accent mb-xs">{personalInfo.fullName || 'Your Name'}</h1>
                <div className="contact-info text-sm text-gray-600 flex flex-wrap gap-md">
                    {personalInfo.email && <span>📧 {personalInfo.email}</span>}
                    {personalInfo.phone && <span>📱 {personalInfo.phone}</span>}
                    {personalInfo.linkedin && <span>🔗 {personalInfo.linkedin}</span>}
                    {personalInfo.github && <span>💻 {personalInfo.github}</span>}
                </div>
            </div>

            {/* Summary */}
            {/* Dynamic Sections */}
            {(settings.sectionOrder || ['summary', 'experience', 'projects', 'education', 'skills']).map(section => {
                const isVisible = settings.visibleSections[section] !== false;
                if (!isVisible) return null;

                switch (section) {
                    case 'summary':
                        return personalInfo.summary && (
                            <div key="summary" className="resume-section mb-lg">
                                <h3 className="section-title text-uppercase font-bold text-lg text-black mb-sm border-b-2 border-black pb-xs">Professional Summary</h3>
                                <p className="text-sm leading-relaxed text-gray-900">{personalInfo.summary}</p>
                            </div>
                        );
                    case 'experience':
                        return experience.length > 0 && (
                            <div key="experience" className="resume-section mb-lg">
                                <h3 className="section-title text-uppercase font-bold text-lg text-black mb-sm border-b-2 border-black pb-xs">Experience</h3>
                                <div className="flex flex-col gap-md">
                                    {experience.map(exp => (
                                        <div key={exp.id} className="experience-item">
                                            <div className="flex justify-between items-baseline mb-xs">
                                                <h4 className="font-bold text-black text-md">{exp.role}</h4>
                                                <span className="text-sm text-black font-semibold">{exp.duration}</span>
                                            </div>
                                            <div className="text-black font-bold text-sm mb-xs">{exp.company}</div>
                                            <p className="text-sm whitespace-pre-wrap text-black">{exp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    case 'projects':
                        return projects.length > 0 && (
                            <div key="projects" className="resume-section mb-lg">
                                <h3 className="section-title text-uppercase font-bold text-lg text-black mb-sm border-b-2 border-black pb-xs">Projects</h3>
                                <div className="flex flex-col gap-md">
                                    {projects.map(proj => (
                                        <div key={proj.id} className="project-item">
                                            <div className="flex justify-between items-baseline mb-xs">
                                                <h4 className="font-bold text-black text-md">{proj.title}</h4>
                                                {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 font-bold">Link ↗</a>}
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap text-black">{proj.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    case 'education':
                        return education.length > 0 && (
                            <div key="education" className="resume-section mb-lg">
                                <h3 className="section-title text-uppercase font-bold text-lg text-black mb-sm border-b-2 border-black pb-xs">Education</h3>
                                <div className="flex flex-col gap-md">
                                    {education.map(edu => (
                                        <div key={edu.id} className="education-item flex justify-between">
                                            <div>
                                                <h4 className="font-bold text-black text-md">{edu.school}</h4>
                                                <div className="text-sm text-black">{edu.degree}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-black">{edu.year}</div>
                                                {edu.score && <div className="text-sm text-black font-medium">GPA/Score: {edu.score}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    case 'skills':
                        return skills.length > 0 && (
                            <div key="skills" className="resume-section">
                                <h3 className="section-title text-uppercase font-bold text-lg text-black mb-sm border-b-2 border-black pb-xs">Skills</h3>
                                <div className="flex flex-wrap gap-xs">
                                    {skills.map((skill, idx) => (
                                        <span key={idx} className="skill-tag bg-gray-200 px-sm py-xs rounded text-sm text-gray-700">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    default: return null;
                }
            })}
        </div>
    );
};
