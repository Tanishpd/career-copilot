import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, '../ai_debug.log');

class AIInterviewer {
    constructor() {
        // OpenAI Config (Primary)
        this.openaiKey = process.env.OPENAI_API_KEY;
        this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';

        // Gemini Config (Fallback)
        this.geminiKey = process.env.AI_API_KEY; // Kept legacy name for compatibility
        this.geminiModel = process.env.AI_MODEL || 'gemini-1.5-flash';

        this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 1000;
    }

    /**
     * Explain a coding problem clearly without revealing the solution
     */
    async explainProblem(question) {
        const prompt = `You are an AI interviewer conducting a coding interview. 
    
Explain this coding problem to the candidate in simple, clear language:

Title: ${question.title}
Description: ${question.description}
Difficulty: ${question.difficulty}
Category: ${question.category}

Your explanation should:
1. Clarify the problem statement
2. Explain input/output format
3. Mention constraints and edge cases
4. Help them understand what's expected
5. DO NOT reveal the solution or exact algorithm
6. DO NOT write any code

Keep it conversational, encouraging, and suitable for Text-to-Speech (no complex markdown, no code blocks). Talk as if you are speaking to the candidate.`;

        return await this.callAI(prompt);
    }

    /**
     * Evaluate code quality, complexity, and logic
     */
    async evaluateCode(code, question) {
        const prompt = `Analyze this code submission for the problem "${question.title}":

Code:
\`\`\`
${code}
\`\`\`

Problem Description: ${question.description}
Constraints: ${question.constraints}

Provide a structured evaluation in JSON format:
{
  "timeComplexity": "O(?) - Explanation",
  "spaceComplexity": "O(?) - Explanation",
  "codeQuality": {
    "score": 0-10,
    "feedback": "Specific feedback on readability, naming, modularity"
  },
  "logicCorrectness": {
    "score": 0-10, 
    "feedback": "Feedback on logic, potential edge cases missing"
  },
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

        const response = await this.callAI(prompt);

        try {
            // Clean up code blocks if present
            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Error parsing AI evaluation:', error);
            return {
                timeComplexity: "Unknown",
                spaceComplexity: "Unknown",
                codeQuality: { score: 5, feedback: "AI evaluation failed" },
                logicCorrectness: { score: 5, feedback: "AI evaluation failed" },
                suggestions: []
            };
        }
    }

    /**
     * Monitor code changes for specific logic events
     */
    async monitorCode(context) {
        const { code, previousCode, question } = context;

        // 1. Calculate Diff (Primitive line check)
        const currentLines = code.split('\n');
        const prevLines = (previousCode || '').split('\n');

        if (currentLines.length <= prevLines.length) return null; // Deletion or edit, ignore for now

        // Find the new line
        const newLineIndex = currentLines.findIndex((line, i) => line !== prevLines[i]);
        if (newLineIndex === -1) return null;

        const addedLine = currentLines[newLineIndex].trim();
        if (addedLine.length < 5) return null; // Ignore braces/short lines

        // 2. Logic Triggers
        if (addedLine.startsWith('for') || addedLine.startsWith('while')) {
            return "Correct. You are setting up a loop to traverse the data.";
        }
        if (addedLine.startsWith('if')) {
            return "Good. You are handling a condition here.";
        }
        if (addedLine.includes('+=') || (addedLine.includes('=') && addedLine.includes('+'))) {
            return "This line accumulates the result. Correct.";
        }
        if (addedLine.includes('new Map') || addedLine.includes('{}') || addedLine.includes('dict()')) {
            return "Initializing a Hash Map. Good choice for O(1) lookups.";
        }
        if (addedLine.startsWith('return')) {
            return "And finally returning the result.";
        }

        return null;
    }

    /**
     * Generate interview questions based on candidate's code
     */
    async generateInterviewQuestion(context) {
        const { code, question, interactionHistory } = context;

        const prompt = `You are an AI interviewer. The candidate is working on this problem:
"${question.title}"

Their current code:
\`\`\`
${code}
\`\`\`

Previous conversation:
${interactionHistory.slice(-3).map(h => `${h.type}: ${h.content}`).join('\n')}

Ask ONE smart interview question to evaluate their thinking. Choose from:
- "What approach are you using?"
- "Why did you choose this data structure?"
- "How will you handle edge cases like [specific case]?"
- "What is the time complexity of your solution?"
- "Can you explain your logic for [specific part]?"
- "Have you considered [alternative approach]?"

Be specific to their code. Keep it short, conversational, and suitable for voice (no markdown).`;

        return await this.callAI(prompt);
    }

    /**
     * Detect if code appears to be AI-generated or copy-pasted
     */
    async detectMalpractice(submission) {
        const { code, explanation, interactionHistory, codeChanges } = submission;

        const prompt = `Analyze this coding submission for potential malpractice:

Code:
\`\`\`
${code}
\`\`\`

Candidate's explanation: "${explanation}"

Interaction history count: ${interactionHistory.length}
Code changes: ${codeChanges.length}

Check for:
1. AI-generated code patterns (perfect formatting, generic variable names, excessive comments)
2. Sudden complete code without incremental development
3. Explanation quality vs code quality mismatch
4. Lack of interaction despite complex code

Respond with JSON:
{
  "isSuspicious": true/false,
  "confidence": 0-100,
  "reasons": ["reason1", "reason2"],
  "recommendation": "low/medium/high risk"
}`;

        const response = await this.callAI(prompt);

        try {
            return JSON.parse(response);
        } catch (error) {
            return {
                isSuspicious: false,
                confidence: 0,
                reasons: [],
                recommendation: 'low'
            };
        }
    }

    /**
     * Provide hints when allowed
     */
    async provideHint(question, currentCode, hintLevel) {
        const prompt = `The candidate is stuck on this problem:
"${question.title}"

Their current code:
\`\`\`
${currentCode}
\`\`\`

Provide a hint (level ${hintLevel}/3). 
- Level 1: Gentle nudge about approach
- Level 2: Suggest specific data structure or algorithm
- Level 3: More direct guidance (but still no complete solution)

Keep it brief, helpful, and suitable for voice (no code blocks).`;

        return await this.callAI(prompt);
    }

    /**
     * Generate content for resume
     */
    async generateResumeContent(section, currentContent) {
        const prompt = `You are a professional resume writer. 
Improve or generate content for the "${section}" section of a resume.

Current content (if any):
"${currentContent || 'None'}"

Provide 3 distinct, professional options for this section.
If the section is "Summary", provide 3 professional summaries.
If the section is "Experience", improve the bullet points to be action-oriented and result-driven.

Return ONLY a JSON array of strings:
["Option 1 content...", "Option 2 content...", "Option 3 content..."]`;

        const response = await this.callAI(prompt);
        try {
            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const arrayStart = jsonStr.indexOf('[');
            const arrayEnd = jsonStr.lastIndexOf(']');
            if (arrayStart !== -1 && arrayEnd !== -1) {
                return JSON.parse(jsonStr.substring(arrayStart, arrayEnd + 1));
            }
            return [response];
        } catch (e) {
            return ["Could not generate specific options. Try again."];
        }
    }

    async selectInterestingLine(code) {
        if (!code) return null;
        const lines = code.split('\n');
        const interesting = lines.find(l =>
            (l.includes('for') || l.includes('if') || l.includes('while') || l.includes('return')) &&
            l.trim().length > 10
        );
        return interesting ? interesting.trim() : "your main loop";
    }

    async replyToCandidate(history, latestResponse, session, questionContext = {}) {
        const flow = session?.interviewFlow || {};
        const flags = flow.flags || {};
        let stage = flow.currentStage || 'INTRODUCTION';
        let reply = "";
        let nextStage = stage;
        let updates = {};

        const answer = latestResponse.toLowerCase().trim();
        const wordCount = answer.split(' ').length;

        if (stage === 'TECHNICAL_SCREEN' || stage === 'CODING_CHALLENGE') {
            stage = 'INTRODUCTION';
            nextStage = 'INTRODUCTION';
        }

        if (stage === 'INTRODUCTION') {
            if (!flags.intro_done) {
                if (history.length < 1 && wordCount < 2) {
                    reply = `Hello! I am your AI Interviewer. Please introduce yourself briefly.`;
                } else {
                    reply = `Thank you. It's great to meet you. Let's move to the technical assessment.
                    Here is your coding problem: ${questionContext.title || 'the problem'}. 
                    Please explain the problem statement in your own words.`;
                    nextStage = 'PROBLEM_EXPLANATION';
                    updates.intro_done = true;
                }
            } else {
                reply = "Let's move to the technical assessment. Please explain the problem statement in your own words.";
                nextStage = 'PROBLEM_EXPLANATION';
            }
        }
        else if (stage === 'PROBLEM_EXPLANATION') {
            if (wordCount > 5 && (answer.includes('input') || answer.includes('output') || answer.includes('goal') || answer.includes('find') || answer.includes('array'))) {
                reply = "You explained the goal correctly. Let's talk about your approach. How will you solve this?";
                nextStage = 'APPROACH';
                updates.problem_explained = true;
            } else {
                reply = "Could you confirm the input and output format?";
            }
        }
        else if (stage === 'APPROACH') {
            if (answer.includes('loop') || answer.includes('iterate') || answer.includes('recursion') || answer.includes('pointer') || answer.includes('sort')) {
                reply = "Yes, that approach is valid. Which data structure will you use to implement it?";
                nextStage = 'DATA_STRUCTURE';
                updates.approach_done = true;
            } else {
                reply = "Can you describe the algorithm or steps you will follow?";
            }
        }
        else if (stage === 'DATA_STRUCTURE') {
            if (!flags.datastruct_done) {
                if (answer.includes('array') || answer.includes('map') || answer.includes('list') || answer.includes('set') || answer.includes('stack') || answer.includes('queue')) {
                    reply = "Correct. Why did you choose this data structure instead of others?";
                    updates.datastruct_done = true;
                } else {
                    reply = "What specific data structure fits your approach?";
                }
            } else {
                if (wordCount > 5) {
                    reply = "Good. That logic ensures efficiency. Now start writing the code. Focus on the main logic first.";
                    nextStage = 'CODE_WRITING';
                    updates.logic_done = true;
                    updates.code_started = true;
                } else {
                    reply = "Could you elaborate on the efficiency?";
                }
            }
        }
        else if (stage === 'LOGIC_JUSTIFICATION') {
            reply = "That sounds reasonable. Now start writing the code.";
            nextStage = 'CODE_WRITING';
        }
        else if (stage === 'CODE_WRITING') {
            if (answer.includes('completed') || answer.includes('finished') || answer.includes('done')) {
                const line = "your main loop";
                reply = `Great. Now, let's look at your code. Explain what ${line} does.`;
                nextStage = 'LINE_EXPLANATION';
                updates.code_completed = true;
            } else {
                if (answer.includes('?')) {
                    reply = "I cannot assist with the solution directly. Please proceed with your logic.";
                } else {
                    reply = "";
                }
            }
        }
        else if (stage === 'LINE_EXPLANATION') {
            reply = "Understood. What edge cases does your solution handle?";
            nextStage = 'EDGE_CASES';
        }
        else if (stage === 'EDGE_CASES') {
            reply = "Good. Finally, what is the time and space complexity of your solution?";
            nextStage = 'COMPLEXITY';
        }
        else if (stage === 'COMPLEXITY') {
            reply = "This question is now complete. Please submit your solution. Let's move to the next question.";
            nextStage = 'COMPLETED';
            updates.complexity_done = true;
        }

        return {
            text: reply,
            newStage: nextStage,
            updates: updates
        };
    }

    /**
     * INTELLIGENT ROUTER: Tries OpenAI first, then Gemini, then Mock
     */
    async callAI(prompt) {
        // 1. Try OpenAI (Primary)
        try {
            if (!this.openaiKey) throw new Error("No OpenAI Key");
            return await this.callOpenAI(prompt);
        } catch (openaiError) {
            console.warn(`[AI Router] OpenAI Failed: ${openaiError.message}. Switching to Gemini...`);
            fs.writeFileSync(logFile, `\n[FAILOVER] OpenAI Failed: ${openaiError.message}\n`, { flag: 'a' });

            // 2. Try Gemini (Secondary)
            try {
                if (!this.geminiKey) throw new Error("No Gemini Key");
                return await this.callGemini(prompt);
            } catch (geminiError) {
                console.error(`[AI Router] Gemini Failed: ${geminiError.message}. Using MOCK.`);
                fs.writeFileSync(logFile, `\n[FAILOVER] Gemini Failed: ${geminiError.message}\n`, { flag: 'a' });

                // 3. Fallback to Mock
                return await this.mockResponse(prompt);
            }
        }
    }

    /**
     * Call OpenAI API
     */
    async callOpenAI(prompt) {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: this.openaiModel,
                messages: [
                    { role: "system", content: "You are an expert technical interviewer." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.openaiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content;
    }

    /**
     * Call Google Gemini API
     */
    async callGemini(prompt) {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`,
            {
                contents: [{
                    parts: [{
                        text: `You are an expert technical interviewer. Be clear, concise, and helpful without revealing solutions.\n\n${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: this.maxTokens
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.candidates[0].content.parts[0].text;
    }

    /**
     * MOCK AI for Ultimate Fallback
     */
    async mockResponse(prompt) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (prompt.includes('ONLY a JSON object') || prompt.includes('strictly as JSON')) {
            if (prompt.includes('idea')) {
                return JSON.stringify({
                    topic: "Mock Topic",
                    idea: "A mock idea for a problem involving a robot in a space station."
                });
            }
            if (prompt.includes('FULL and DETAILED coding exam question')) {
                return JSON.stringify({
                    problem: {
                        title: "Mock Problem Title",
                        description: "<h3>Mock Description</h3><p>Paragraph 1...</p>",
                        inputFormat: "Integer n",
                        outputFormat: "Return int",
                        constraints: ["1 <= n <= 100"],
                        examples: [{ input: "1", output: "1", explanation: "Mock" }, { input: "2", output: "2", explanation: "Mock" }]
                    },
                    structure: { functionName: "solve", returnType: "int", parameters: [{ name: "n", type: "int" }] },
                    codeTemplates: { javascript: "// Code here" },
                    testCases: { visible: [{ input: "1", expectedOutput: "1" }], hidden: [] }
                });
            }
        }

        if (prompt.includes('Explain this coding problem')) {
            return "This creates a mock explanation for the problem. You need to write a function that solves the specific algorithmic challenge described previously.";
        }
        if (prompt.includes('Analyze this code')) {
            return JSON.stringify({
                timeComplexity: "O(n) - Mock Analysis",
                spaceComplexity: "O(1) - Mock Analysis",
                codeQuality: { score: 8, feedback: "Good mock structure." },
                logicCorrectness: { score: 9, feedback: "Logic seems logic-y." },
                suggestions: ["System is offline. Using mock response."]
            });
        }
        return "System is currently offline (Mock Mode). Please check API configuration.";
    }
}

export default new AIInterviewer();
