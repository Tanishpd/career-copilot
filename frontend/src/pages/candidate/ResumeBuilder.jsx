import React, { useState } from 'react';
import { ResumeProvider } from '../../context/ResumeContext';
import { ResumeEditor } from './ResumeEditor';
import { ResumePreview } from './ResumePreview';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import './ResumeBuilder.css';

export const ResumeBuilder = () => {
    return (
        <ErrorBoundary>
            <ResumeProvider>
                <div className="resume-builder-layout">
                    <div className="panel-left">
                        <ResumeEditor />
                    </div>
                    <div className="panel-right">
                        <ResumePreview />
                    </div>
                </div>
            </ResumeProvider>
        </ErrorBoundary>
    );
};
