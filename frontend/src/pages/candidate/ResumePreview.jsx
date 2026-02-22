import React from 'react';
import { useResume } from '../../context/ResumeContext';
import html2pdf from 'html2pdf.js';

import { TemplateModern } from './templates/TemplateModern';
import { TemplateMinimal } from './templates/TemplateMinimal';
import { TemplateCreative } from './templates/TemplateCreative';

export const ResumePreview = () => {
    const { resumeData } = useResume();
    const { personalInfo, settings } = resumeData;

    const handleDownload = () => {
        const element = document.getElementById('resume-content');
        const opt = {
            margin: 0,
            filename: `${personalInfo.fullName || 'Resume'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const renderTemplate = () => {
        switch (settings.templateId) {
            case 'minimal': return <TemplateMinimal resumeData={resumeData} />;
            case 'creative': return <TemplateCreative resumeData={resumeData} />;
            case 'modern':
            default: return <TemplateModern resumeData={resumeData} />;
        }
    };

    return (
        <div className="resume-preview-container bg-gray-100 p-xl overflow-y-auto h-full flex flex-col items-center">
            {/* Toolbar */}
            <div className="preview-toolbar mb-md w-full max-w-a4 flex justify-end gap-sm">
                <button onClick={handleDownload} className="btn btn-primary flex items-center gap-xs">
                    <span>⬇️</span> Download PDF
                </button>
            </div>

            {/* The ID 'resume-content' is inside the templates now */}
            {renderTemplate()}
        </div>
    );
};
