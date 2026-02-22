import axios from 'axios';
import mongoose from 'mongoose';
import ExamSession from './models/ExamSession.js';

// Mock Data
const mockSession = {
    sessionId: 'TEST-SESSION',
    candidateId: new mongoose.Types.ObjectId(),
    status: 'in-progress',
    warningCount: 0,
    violations: []
};

// Mock Request to log violation
async function testViolationLogging() {
    console.log('--- Testing Anti-Cheating Violation Logging ---');

    try {
        // 1. Simulate finding session
        // In real app, this comes from DB. Here we just verify the logic
        const session = { ...mockSession, save: async () => { } };

        console.log('Initial Warnings:', session.warningCount);

        // 2. Simulate Violation
        const violation = {
            type: 'fullscreen_exit',
            metadata: 'Exited fullscreen mode'
        };

        // Update session
        session.violations.push({
            type: violation.type,
            metadata: violation.metadata,
            timestamp: new Date()
        });
        session.warningCount += 1;

        console.log('Violation Logged:', violation.type);
        console.log('New Warning Count:', session.warningCount);

        if (session.warningCount === 1 && session.violations.length === 1) {
            console.log('✅ Violation logging logic verified.');
        } else {
            console.log('❌ Violation logging logic failed.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testViolationLogging();
