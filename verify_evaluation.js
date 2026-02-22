import codeEvaluator from './backend/services/codeEvaluator.js';

// Mock Data
const mockQuestion = {
    title: "Sum of Two Numbers",
    description: "Write a function that takes two numbers and returns their sum.",
    constraints: "Input numbers are integers.",
    category: "DSA",
    testCases: [
        { input: "1\n2", expectedOutput: "3", isHidden: false },
        { input: "10\n20", expectedOutput: "30", isHidden: true }
    ]
};

const mockSubmission = {
    code: `
        const fs = require('fs');
        const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
        const a = parseInt(input[0]);
        const b = parseInt(input[1]);
        console.log(a + b);
    `,
    language: 'javascript',
    explanation: "I read the input, parsed integers, and printed the sum.",
    approach: "Basic arithmetic addition.",
    interactionHistory: [],
    timeSpent: 300
};

async function testEvaluation() {
    console.log('--- Testing Code Evaluator ---');

    try {
        const result = await codeEvaluator.evaluateSubmission(mockSubmission, mockQuestion);

        console.log('\nScores:', result.scores);
        console.log('Test Results:', result.testResults);
        console.log('AI Feedback:', result.feedback.codeQualityAndLogic);
        console.log('Recommendation:', result.recommendation);

        if (result.testResults.passedCount === 2) {
            console.log('\n✅ logic verification passed: Code passed all test cases.');
        } else {
            console.log('\n❌ logic verification failed: Expected to pass all cases.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testEvaluation();
