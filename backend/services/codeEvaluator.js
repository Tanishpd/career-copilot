import aiInterviewer from './aiInterviewer.js';
import codeRunner from './codeRunner.js';
import * as drivers from '../utils/languageDrivers.js';

class CodeEvaluator {
    /**
     * Evaluate code submission across all categories
     */
    async evaluateSubmission(submission, question) {
        const scores = {
            problemUnderstanding: 0,
            approachAndDataStructures: 0,
            codeQualityAndLogic: 0,
            edgeCasesAndComplexity: 0,
            interactionAndCommunication: 0,
            malpracticeRisk: 0
        };

        const feedback = {
            problemUnderstanding: '',
            approachAndDataStructures: '',
            codeQualityAndLogic: '',
            edgeCasesAndComplexity: '',
            interactionAndCommunication: ''
        };

        // 0. Run Test Cases (Critical for Logic Score)
        const testResults = await this.runTestCases(submission, question);
        const passRate = testResults.passedCount / testResults.totalCount;

        // 7. AI Deep Analysis
        const aiAnalysis = await aiInterviewer.evaluateCode(submission.code, question);

        // 1. Problem Understanding (0-10)
        const understandingScore = this.evaluateProblemUnderstanding(
            submission.explanation,
            submission.approach,
            question
        );
        scores.problemUnderstanding = understandingScore.score;
        feedback.problemUnderstanding = understandingScore.feedback;

        // 2. Approach & Data Structures (0-10)
        // Combine heuristic with AI feedback
        const heuristicApproach = this.evaluateApproach(submission.code, submission.approach, question);
        scores.approachAndDataStructures = Math.round((heuristicApproach.score + (aiAnalysis.timeComplexity !== 'Unknown' ? 8 : 5)) / 2);
        feedback.approachAndDataStructures = `${heuristicApproach.feedback} AI Analysis: Time: ${aiAnalysis.timeComplexity}, Space: ${aiAnalysis.spaceComplexity}`;

        // 3. Code Quality & Logic (0-10)
        const qualityScore = this.evaluateCodeQuality(submission.code);
        scores.codeQualityAndLogic = Math.round((qualityScore.score + aiAnalysis.codeQuality.score) / 2);
        feedback.codeQualityAndLogic = `${qualityScore.feedback} ${aiAnalysis.codeQuality.feedback}`;

        // 4. Edge Cases & Complexity (0-10)
        // Logic Correctness heavily weights on Test Cases
        const logicScoreFromTests = Math.round(passRate * 10);
        scores.edgeCasesAndComplexity = Math.round((logicScoreFromTests + aiAnalysis.logicCorrectness.score) / 2);
        feedback.edgeCasesAndComplexity = `Passed ${testResults.passedCount}/${testResults.totalCount} test cases. ${aiAnalysis.logicCorrectness.feedback}`;

        // 5. Interaction & Communication (0-10)
        const interactionScore = this.evaluateInteraction(
            submission.interactionHistory,
            submission.timeSpent
        );
        scores.interactionAndCommunication = interactionScore.score;
        feedback.interactionAndCommunication = interactionScore.feedback;

        // 6. Malpractice Risk (0-10)
        const malpracticeScore = await this.evaluateMalpractice(submission);
        scores.malpracticeRisk = malpracticeScore.score;

        // Generate strengths and weaknesses
        const { strengths, weaknesses } = this.generateInsights(scores, feedback, aiAnalysis);

        // Generate recommendation
        const recommendation = this.generateRecommendation(scores);

        return {
            scores,
            feedback,
            strengths,
            weaknesses,
            recommendation,
            malpracticeFlags: malpracticeScore.flags,
            testResults
        };
    }

    /**
     * Run test cases
     */
    async runTestCases(submission, question) {
        let passedCount = 0;
        const results = [];
        const testCases = question.testCases || [];

        // If no test cases defined, maybe fail or try sample? 
        // For now preventing crash if empty
        if (testCases.length === 0) {
            return {
                totalCount: 0,
                passedCount: 0,
                results: []
            };
        }

        for (const testCase of testCases) {
            let actualOutput = '';
            let error = null;
            let passed = false;

            try {
                let codeToRun = submission.code;

                // If question has structure, wrap the code with driver
                if (question.structure && question.structure.functionName && drivers) {
                    try {
                        codeToRun = drivers.generateDriver(
                            submission.language,
                            submission.code,
                            question.structure
                        );
                    } catch (driverErr) {
                        console.error('Driver generation failed:', driverErr);
                        // Fallback to raw code if driver fails (or throw?)
                    }
                }

                const result = await codeRunner.run(submission.language, codeToRun, testCase.input);
                actualOutput = result.output ? result.output.trim() : '';
                error = result.error;

                // If there's a runtime error, it's a fail
                if (!error) {
                    const expectedOutput = testCase.expectedOutput ? testCase.expectedOutput.trim() : '';
                    passed = actualOutput === expectedOutput;
                }
            } catch (err) {
                console.error('Error running test case:', err);
                error = 'Execution failed';
            }

            if (passed) passedCount++;

            // Return masked result for hidden test cases
            if (testCase.isHidden) {
                results.push({
                    isHidden: true,
                    passed,
                    // Don't return input/expected/actual for hidden cases
                    input: 'Hidden',
                    expectedOutput: 'Hidden',
                    actualOutput: 'Hidden',
                    error: error ? 'Runtime Error' : null // Maybe show generic error?
                });
            } else {
                results.push({
                    isHidden: false,
                    passed,
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    actualOutput,
                    error
                });
            }
        }

        return {
            totalCount: testCases.length,
            passedCount,
            results
        };
    }

    /**
     * Evaluate problem understanding
     */
    evaluateProblemUnderstanding(explanation, approach, question) {
        let score = 5; // Base score
        let feedback = '';

        if (!explanation || explanation.length < 50) {
            score = 2;
            feedback = 'Explanation is too brief or missing. Should clearly describe understanding of the problem.';
        } else if (explanation.length > 100) {
            score += 2;

            // Check if explanation mentions key problem aspects
            const mentionsConstraints = explanation.toLowerCase().includes('constraint') ||
                explanation.toLowerCase().includes('limit');
            const mentionsEdgeCases = explanation.toLowerCase().includes('edge') ||
                explanation.toLowerCase().includes('special case');

            if (mentionsConstraints) score += 1;
            if (mentionsEdgeCases) score += 1;

            feedback = 'Good understanding demonstrated through detailed explanation.';
        } else {
            feedback = 'Adequate explanation provided.';
        }

        return { score: Math.min(10, score), feedback };
    }

    /**
     * Evaluate approach and data structures
     */
    evaluateApproach(code, approach, question) {
        let score = 5;
        let feedback = '';

        // Check for appropriate data structures
        const hasArrays = /\[|\]|Array/.test(code);
        const hasObjects = /\{|\}|Object/.test(code);
        const hasMap = /Map|Set/.test(code);
        const hasLoops = /for|while|forEach|map|filter|reduce/.test(code);

        if (question.category === 'DSA') {
            if (hasMap || hasObjects) score += 2;
            if (hasLoops) score += 1;
            feedback = 'Appropriate data structures used for the problem.';
        }

        // Check if approach is explained
        if (approach && approach.length > 50) {
            score += 2;
            feedback += ' Clear approach explanation provided.';
        }

        return { score: Math.min(10, score), feedback };
    }

    /**
     * Evaluate code quality and logic
     */
    evaluateCodeQuality(code) {
        let score = 5;
        let feedback = '';

        // Check code length (not too short, not too long)
        if (code.length < 50) {
            score = 2;
            feedback = 'Code appears incomplete or too simplistic.';
        } else if (code.length > 100) {
            score += 2;

            // Check for good practices
            const hasComments = /\/\/|\/\*/.test(code);
            const hasVariableNames = /const|let|var/.test(code);
            const hasFunctions = /function|=>/.test(code);

            if (hasVariableNames) score += 1;
            if (hasFunctions) score += 1;
            if (hasComments) score += 1;

            feedback = 'Code demonstrates good structure and practices.';
        }

        return { score: Math.min(10, score), feedback };
    }

    /**
     * Evaluate edge cases and complexity
     */
    evaluateComplexity(code, explanation, question) {
        let score = 5;
        let feedback = '';

        // Check if complexity is mentioned
        const mentionsComplexity = explanation.toLowerCase().includes('complexity') ||
            explanation.toLowerCase().includes('time') ||
            explanation.toLowerCase().includes('space');

        if (mentionsComplexity) {
            score += 3;
            feedback = 'Time/space complexity analysis provided.';
        }

        // Check for edge case handling
        const hasNullChecks = /null|undefined|!/.test(code);
        const hasEmptyChecks = /length|empty/.test(code);

        if (hasNullChecks || hasEmptyChecks) {
            score += 2;
            feedback += ' Edge cases considered.';
        }

        return { score: Math.min(10, score), feedback };
    }

    /**
     * Evaluate interaction and communication
     */
    evaluateInteraction(interactionHistory, timeSpent) {
        let score = 5;
        let feedback = '';

        const interactionCount = interactionHistory.length;

        if (interactionCount === 0) {
            score = 1;
            feedback = 'No interaction with AI interviewer. Communication is important.';
        } else if (interactionCount < 3) {
            score = 4;
            feedback = 'Limited interaction. More engagement would demonstrate better communication.';
        } else if (interactionCount >= 3 && interactionCount <= 8) {
            score = 8;
            feedback = 'Good interaction and communication throughout the interview.';
        } else {
            score = 10;
            feedback = 'Excellent communication and engagement with the interviewer.';
        }

        // Adjust for time spent (reasonable time shows thoughtfulness)
        if (timeSpent > 300 && timeSpent < 1800) { // 5-30 minutes
            score = Math.min(10, score + 1);
        }

        return { score, feedback };
    }

    /**
     * Evaluate malpractice risk
     */
    async evaluateMalpractice(submission) {
        let score = 0;
        const flags = [];

        // Check suspicious patterns from submission model
        const suspiciousPatterns = submission.detectSuspiciousPatterns();

        if (suspiciousPatterns.includes('sudden-complete-code')) {
            score += 4;
            flags.push({
                type: 'sudden-complete-code',
                reason: 'Code appeared suddenly without incremental development',
                severity: 'high'
            });
        }

        if (suspiciousPatterns.includes('low-interaction-high-code')) {
            score += 3;
            flags.push({
                type: 'low-interaction-high-code',
                reason: 'Complex code with minimal interaction suggests external help',
                severity: 'medium'
            });
        }

        // Use AI to detect AI-generated patterns
        try {
            const aiDetection = await aiInterviewer.detectMalpractice(submission);

            if (aiDetection.isSuspicious && aiDetection.confidence > 70) {
                score += 3;
                flags.push({
                    type: 'ai-generated-pattern',
                    reason: aiDetection.reasons.join(', '),
                    severity: aiDetection.recommendation
                });
            }
        } catch (error) {
            console.error('AI malpractice detection failed:', error);
        }

        return { score: Math.min(10, score), flags };
    }

    /**
     * Generate strengths and weaknesses
     */
    generateInsights(scores, feedback, aiAnalysis) {
        const strengths = [];
        const weaknesses = [];

        Object.entries(scores).forEach(([category, score]) => {
            if (category === 'malpracticeRisk') return; // Skip malpractice in insights

            const categoryName = category.replace(/([A-Z])/g, ' $1').trim();

            if (score >= 8) {
                strengths.push(`Strong ${categoryName.toLowerCase()}`);
            } else if (score <= 4) {
                weaknesses.push(`Needs improvement in ${categoryName.toLowerCase()}`);
            }
        });

        if (strengths.length === 0) {
            strengths.push('Completed the submission');
        }

        if (weaknesses.length === 0) {
            weaknesses.push('None identified');
        }

        return { strengths, weaknesses };
    }

    /**
     * Generate hiring recommendation
     */
    generateRecommendation(scores) {
        const totalScore =
            scores.problemUnderstanding +
            scores.approachAndDataStructures +
            scores.codeQualityAndLogic +
            scores.edgeCasesAndComplexity +
            scores.interactionAndCommunication -
            scores.malpracticeRisk;

        // High malpractice risk = automatic rejection
        if (scores.malpracticeRisk >= 7) {
            return 'No';
        }

        if (totalScore >= 40) {
            return 'Strong Yes';
        } else if (totalScore >= 30) {
            return 'Yes';
        } else if (totalScore >= 20) {
            return 'Borderline';
        } else {
            return 'No';
        }
    }
}

export default new CodeEvaluator();
