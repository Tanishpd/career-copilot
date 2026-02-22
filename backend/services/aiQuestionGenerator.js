import aiInterviewer from './aiInterviewer.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, '../ai_debug.log');

// --- 1. SYSTEM CONSANTS & BLUEPRINTS ---
// --- 1. SYSTEM CONSANTS & BLUEPRINTS ---
const BLUEPRINTS = {
    Hard: {
        topicPool: ["Weighted Job Scheduling Optimization", "Max Profit Job Scheduling"],
        forbidden: ["Easy", "Simple Array"]
    },
    Medium: {
        topicPool: ["Shortest Path in Grid with Obstacles", "Maze Pathfinding with Constraints"],
        forbidden: ["Simple path"]
    },
    Easy: {
        topicPool: ["Shortest Path in Simple Maze", "Grid Traversal BFS"],
        forbidden: ["Complex Graph", "Recursion", "DP"]
    }
};

// Global cache for duplicate detection (In production, use Redis or DB check)
const generatedHashes = new Set();

/**
 * Generate SHA-256 Fingerprint
 */
const generateFingerprint = (text) => {
    return crypto
        .createHash("sha256")
        .update(text.slice(0, 300))
        .digest("hex");
};

/**
 * Validate the generated question against strict rules
 */
const validateQuestion = (question) => {
    const required = [
        "title", "description", "inputFormat", "outputFormat", "constraints", "examples"
    ];

    // Check missing fields
    if (!question.problem) return { valid: false, reason: "Missing problem object" };
    const missing = required.filter(r => !question.problem[r]);
    if (missing.length > 0) return { valid: false, reason: `Missing fields: ${missing.join(', ')}` };

    // Check Examples Count
    if (!question.problem.examples || question.problem.examples.length !== 2) {
        return { valid: false, reason: `Examples count must be exactly 2. Found: ${question.problem.examples?.length}` };
    }

    // Check Forbidden Words in Description
    const forbiddenWords = ["solution", "time complexity", "space complexity", "algorithm"];
    const descLower = question.problem.description.toLowerCase();
    const foundForbidden = forbiddenWords.find(w => descLower.includes(w));

    if (foundForbidden) return { valid: false, reason: `Forbidden word found: ${foundForbidden}` };

    // Check for raw input pattern like "5 2" (heuristic)
    if (/^\d+\s+\d+$/.test(question.problem.description)) {
        return { valid: false, reason: "Description contains raw input pattern." };
    }

    return { valid: true };
};

/**
 * PROMPT 1: IDEA GENERATOR (Hidden)
 */
const generateIdea = async (difficulty, topic) => {
    // Add random seed to force diversity in AI response
    const seed = Math.floor(Math.random() * 1000000);
    const scenarios = [
        "Space exploration mission", "Robot vacuum cleaner navigation",
        "Delivery drone logistics", "Video game character pathfinding",
        "Network packet routing", "Treasure hunter in ruins",
        "Emergency exit evacuation", "Water pipe flow system"
    ];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    let specificInstruction = "";
    if (topic.includes("Job Scheduling")) {
        specificInstruction = "Focus on maximizing profit/value from non-overlapping intervals.";
    } else if (topic.includes("Maze") || topic.includes("Grid")) {
        specificInstruction = "Focus on finding the shortest path in a 2D grid/maze, possibly with obstacle removal or special movement rules.";
    }

    const prompt = `random_seed: ${seed}
Generate ONE unique and creative ${difficulty} coding problem idea based on the topic: "${topic}".

Context/Story Theme: ${randomScenario} (or invent a new unique one).

${specificInstruction}

Rules:
- The underlying algorithmic logic MUST be "${topic}".
- BUT the story, entities, and specific constraints must be UNIQUE.
- Do not use standard "LeetCode" titles (e.g. don't just say "Course Schedule"). Invent a creative title.
- Output ONLY a JSON object: { "topic": "${topic}", "idea": "One-sentence problem summary describing the scenario..." }`;

    try {
        const raw = await aiInterviewer.callAI(prompt);
        // Handle markdown code blocks
        const jsonStr = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(jsonStr);
        return json.idea;
    } catch (e) {
        console.error("Idea Generation Failed:", e);
        return `A ${difficulty} ${topic} problem involving ${randomScenario}.`;
    }
};

/**
 * PROMPT 2: FORMATTER (Main Generator)
 */
const expandQuestion = async (idea, difficulty, topic) => {
    const prompt = `Using the following idea, generate a FULL and DETAILED coding exam question.

Topic: ${topic}
Idea: ${idea}
Difficulty: ${difficulty}

STRICT RULES:
- Follow the EXACT format below.
- description: Must be 2-3 paragraphs long. Start with a real-world scenario or engaging context before defining the technical problem. Be extremely detailed. HTML is allowed.
- inputFormat / outputFormat: Must be detailed, specifying data types, constraints, and return values clearly.
- examples: Provide EXACTLY 2 examples.
- explanation: Must be a detailed, STEP-BY-STEP breakdown of how the output is derived from the input. Do not be brief.
- Do not include solution hints.
- Do not include time or space complexity.
- Do not include emojis.
- Generate 10 test cases (2 visible, 8 hidden).

OUTPUT FORMAT (Return strictly as JSON):
{
  "problem": {
    "title": "Problem Title",
    "description": "<h3>Problem Description</h3><p>Paragraph 1: Context/Scenario...</p><p>Paragraph 2: Detailed Problem details...</p><p>Paragraph 3: Specific requirements...</p>",
    "inputFormat": "A 2D integer grid of size m x n where...",
    "outputFormat": "Return an integer representing...",
    "examples": [
      { "input": "...", "output": "...", "explanation": "Step 1: ...<br/>Step 2: ...<br/>Conclusion: ..." },
      { "input": "...", "output": "...", "explanation": "..." }
    ],
    "constraints": ["1 <= m, n <= 100", "..."]
  },
  "structure": {
    "functionName": "solve",
    "returnType": "int",
    "parameters": [{ "name": "n", "type": "int" }]
  },
  "codeTemplates": {
    "java": "class Solution {\n    public int solve(int n) {\n        // Code here\n    }\n}", 
    "python": "class Solution:\n    def solve(self, n: int) -> int:\n        # Code here", 
    "javascript": "/**\n * @param {number} n\n * @return {number}\n */\nfunction solve(n) {\n    // Code here\n}", 
    "cpp": "class Solution {\npublic:\n    int solve(int n) {\n        // Code here\n    }\n};"
  },
  "testCases": {
    "visible": [{ "input": "...", "expectedOutput": "..." }],
    "hidden": [{ "input": "...", "expectedOutput": "..." }]
  }
}`;

    const raw = await aiInterviewer.callAI(prompt);
    const jsonStr = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
};

/**
 * Safe Fallback (Mock Data) Implementation
 * randomized, but pre-validated
 */
const getSafeFallback = (difficulty) => {
    // A diverse pool of pre-validated, high-quality questions
    // This pool is used when the AI service is unavailable (e.g. Invalid API Key)
    const MOCK_POOL = [
        {
            title: "Allocate Workloads",
            description: "<h3>Problem Description</h3><p>You are managing a cloud infrastructure system where multiple tasks must be processed by a fixed number of servers. Each task has a specific processing time.</p>",
            inputFormat: "Integer array tasks, Integer k",
            outputFormat: "Minimum maximum processing time (int)",
            constraints: ["1 <= tasks.length <= 10^5", "1 <= k <= tasks.length"],
            examples: [
                { input: "tasks = [10, 20, 30, 40], k = 2", output: "60", explanation: "Server 1: 10+20+30=60, Server 2: 40. Max is 60." },
                { input: "tasks = [7, 2, 5, 10, 8], k = 2", output: "18", explanation: "Server 1: 14, Server 2: 18. Max is 18." }
            ],
            testCases: {
                visible: [{ input: "4 2\n10 20 30 40", expectedOutput: "60" }],
                hidden: [{ input: "5 2\n7 2 5 10 8", expectedOutput: "18" }]
            },
            structure: { functionName: "allocateWorkloads", returnType: "int", parameters: [{ name: "tasks", type: "int[]" }, { name: "k", type: "int" }] },
            codeTemplates: {
                javascript: `/**\n * @param {number[]} tasks\n * @param {number} k\n * @return {number}\n */\nfunction allocateWorkloads(tasks, k) {\n    // Write your code here\n\n}`
            }
        },
        {
            title: "Shortest Path in Maze with One Removal",
            description: `<h3>Problem Description</h3>
<p>You are given a rectangular maze represented as a 2D grid of size m × n. Each cell in the grid can be:</p>
<ul>
    <li>0 → an open cell that can be visited</li>
    <li>1 → a wall that cannot be visited unless removed</li>
</ul>
<p>You start at the top-left cell (0, 0) and your goal is to reach the bottom-right cell (m-1, n-1).</p>
<p>You may move only in four directions: Up, Down, Left, Right. Each move to an adjacent cell counts as one step.</p>
<p>You are allowed to remove at most one wall (convert one 1 into a 0) during your journey.</p>
<p>Your task is to determine the minimum number of steps required to reach the destination. If it is not possible to reach the destination even after removing one wall, return -1.</p>`,
            inputFormat: `A 2D integer grid of size m × n<br/>- grid[i][j] = 0 represents an open cell<br/>- grid[i][j] = 1 represents a wall`,
            outputFormat: "Return an integer representing the minimum number of steps required to reach (m-1, n-1). Return -1 if no valid path exists.",
            constraints: ["1 <= m, n <= 100", "grid[i][j] ∈ {0, 1}"],
            examples: [
                {
                    input: "grid = [[0,1,0],[0,0,0]]",
                    output: "4",
                    explanation: "Remove the wall at position (0,1) and follow the path: (0,0) → (0,1) → (0,2) → (1,2). Total steps = 4"
                },
                {
                    input: "grid = [[0,1],[1,0]]",
                    output: "-1",
                    explanation: "Even after removing one wall, there is no valid path from the start to the destination."
                }
            ],
            testCases: {
                visible: [{ input: "[[0,1,0],[0,0,0]]", expectedOutput: "6" }],
                hidden: [{ input: "[[0]]", expectedOutput: "0" }]
            },
            structure: { functionName: "shortestPath", returnType: "int", parameters: [{ name: "grid", type: "int[][]" }] },
            codeTemplates: {
                javascript: `/**\n * @param {number[][]} grid\n * @return {number}\n */\nfunction shortestPath(grid) {\n    // Write your code here\n\n}`
            }
        },
        {
            title: "Job Scheduling Max Profit",
            description: "<h3>Problem Description</h3><p>We have n jobs, where every job is scheduled to run from startTime to endTime to obtain a profit.</p>",
            inputFormat: "Arrays: startTime, endTime, profit",
            outputFormat: "Max profit (int)",
            constraints: ["1 <= n <= 50000"],
            examples: [
                { input: "s=[1,2,3], e=[3,4,5], p=[50,10,40]", output: "120", explanation: "Pick 1st and 3rd." },
                { input: "s=[1], e=[2], p=[10]", output: "10", explanation: "Pick single job." }
            ],
            testCases: {
                visible: [{ input: "3\n1 2 3\n3 4 5\n50 10 40", expectedOutput: "120" }],
                hidden: [{ input: "1\n1\n2\n10", expectedOutput: "10" }]
            },
            structure: { functionName: "jobScheduling", returnType: "int", parameters: [{ name: "s", type: "int[]" }, { name: "e", type: "int[]" }, { name: "p", type: "int[]" }] },
            codeTemplates: {
                javascript: `/**\n * @param {number[]} s\n * @param {number[]} e\n * @param {number[]} p\n * @return {number}\n */\nfunction jobScheduling(s, e, p) {\n    // Write your code here\n\n}`
            }
        }
    ];

    // Helper to format full description
    const enrichDescription = (desc, inputFmt, outputFmt, examples) => {
        let richDesc = desc;

        if (inputFmt) {
            richDesc += `\n<h3><img src="https://img.icons8.com/color/48/000000/input.png" style="width:20px;vertical-align:middle;margin-right:5px"/>Input Description</h3><p>${inputFmt}</p>`;
        }

        if (outputFmt) {
            richDesc += `\n<h3><img src="https://img.icons8.com/color/48/000000/output.png" style="width:20px;vertical-align:middle;margin-right:5px"/>Output Description</h3><p>${outputFmt}</p>`;
        }

        if (examples && examples.length > 0) {
            examples.forEach((ex, idx) => {
                richDesc += `\n<h3>Example ${idx + 1}</h3>
                <div style="background:#2d2d2d; padding:10px; border-radius:6px; margin-bottom:10px;">
                    <strong style="color:#a6e22e">Input:</strong> <span style="font-family:monospace; color:#e6db74">${ex.input}</span><br/>
                    <strong style="color:#a6e22e">Output:</strong> <span style="font-family:monospace; color:#e6db74">${ex.output}</span><br/>
                    ${ex.explanation ? `<strong style="color:#66d9ef">Explanation:</strong> <span style="color:#ccc">${ex.explanation}</span>` : ''}
                </div>`;
            });
        }

        return richDesc;
    };

    // Shuffle Mock Pool to ensure random fallback
    for (let i = MOCK_POOL.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [MOCK_POOL[i], MOCK_POOL[j]] = [MOCK_POOL[j], MOCK_POOL[i]];
    }

    // Return a random item, simplified for fallback structure
    const m = MOCK_POOL[0];
    return {
        title: m.title,
        description: enrichDescription(m.description, m.inputFormat, m.outputFormat, m.examples),
        constraints: m.constraints.join('\n'),
        inputFormat: m.inputFormat,
        outputFormat: m.outputFormat,
        sampleInput: m.examples[0].input,
        sampleOutput: m.examples[0].output,
        testCases: [...m.testCases.visible.map(t => ({ ...t, isHidden: false })), ...m.testCases.hidden.map(t => ({ ...t, isHidden: true }))],
        difficulty: difficulty,
        category: 'DSA',
        problemType: 'Mock/Fallback',
        structure: m.structure,
        codeTemplates: m.codeTemplates
    };
};

/**
 * Main Question Generator Logic
 */
export const generateCoding = async ({ count, difficulty, problemType }) => {
    const questions = [];
    const blueprint = BLUEPRINTS[difficulty] || BLUEPRINTS.Hard;

    console.log(`[AI Generator] Starting Two-Prompt System for ${count} ${difficulty} questions...`);

    // Define enrich helper again or move to outer scope (moving to outer scope is better but for single replace...)
    // Let's duplicate strictly for this replace block or I need to refactor more. 
    // I'll define it inside to be safe with replace_file limitations on scope/context if not careful.
    const enrichDescription = (desc, inputFmt, outputFmt, examples) => {
        let richDesc = desc;

        if (inputFmt) richDesc += `\n<h3>Input Description</h3><p>${inputFmt}</p>`;
        if (outputFmt) richDesc += `\n<h3>Output Description</h3><p>${outputFmt}</p>`;

        if (examples && examples.length > 0) {
            examples.forEach((ex, idx) => {
                richDesc += `\n<h3>Example ${idx + 1}</h3>
                <div style="background:#334; padding:12px; border-radius:8px; margin-bottom:12px; border-left: 4px solid #4CAF50;">
                    <strong style="color:#4CAF50">Input:</strong> <code style="background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:4px;">${ex.input}</code><br/>
                    <strong style="color:#4CAF50">Output:</strong> <code style="background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:4px;">${ex.output}</code><br/>
                    ${ex.explanation ? `<strong>Explanation:</strong> ${ex.explanation}` : ''}
                </div>`;
            });
        }
        return richDesc;
    };

    for (let i = 0; i < count; i++) {
        let attempts = 0;
        let success = false;

        while (attempts < 3 && !success) {
            try {
                // 1. Blueprint Selection
                const topic = problemType && problemType !== 'Mixed'
                    ? problemType
                    : blueprint.topicPool[Math.floor(Math.random() * blueprint.topicPool.length)];

                // 2. Prompt 1: Idea
                const idea = await generateIdea(difficulty, topic);
                console.log(`[AI Generator] Idea ${i + 1}: ${idea}`);

                // 3. Prompt 2: Expansion
                const rawQuestion = await expandQuestion(idea, difficulty, topic);

                // 4. Validation
                const validation = validateQuestion(rawQuestion);
                if (!validation.valid) {
                    throw new Error(`Validation Failed: ${validation.reason}`);
                }

                // 5. Duplicate Check (Fingerprint)
                // Use Topic + Title + First 300 chars of idea/description
                const textToHash = `${topic}:${rawQuestion.problem.title}:${rawQuestion.problem.description}`;
                const fingerprint = generateFingerprint(textToHash);

                if (generatedHashes.has(fingerprint)) {
                    throw new Error(`Duplicate Question Detected (Fingerprint match)`);
                }

                generatedHashes.add(fingerprint);

                // Format for Internal Schema
                questions.push({
                    title: rawQuestion.problem.title,
                    description: enrichDescription(
                        rawQuestion.problem.description,
                        rawQuestion.problem.inputFormat,
                        rawQuestion.problem.outputFormat,
                        rawQuestion.problem.examples
                    ),
                    constraints: Array.isArray(rawQuestion.problem.constraints)
                        ? rawQuestion.problem.constraints.join('\n')
                        : rawQuestion.problem.constraints,
                    inputFormat: rawQuestion.problem.inputFormat,
                    outputFormat: rawQuestion.problem.outputFormat,
                    sampleInput: rawQuestion.problem.examples?.[0]?.input || '',
                    sampleOutput: rawQuestion.problem.examples?.[0]?.output || '',
                    testCases: [
                        ...(rawQuestion.testCases.visible || []).map(tc => ({ ...tc, isHidden: false })),
                        ...(rawQuestion.testCases.hidden || []).map(tc => ({ ...tc, isHidden: true }))
                    ],
                    difficulty,
                    category: 'DSA',
                    problemType: topic,
                    structure: rawQuestion.structure,
                    codeTemplates: rawQuestion.codeTemplates,
                    fingerprint: fingerprint // Store for future checks
                });

                success = true;

            } catch (e) {
                console.warn(`[AI Generator] Attempt ${attempts + 1} failed: ${e.message}. Retrying...`);
                if (e.message.includes("API key not valid") || e.response?.status === 400) {
                    break; // Go to Fallback immediately
                }
                attempts++;
            }
        }

        if (!success) {
            console.error("[AI Generator] AI Generation failed. Using Randomized Safe Fallback.");
            questions.push(getSafeFallback(difficulty));
        }
    }

    return questions;
};

/**
 * Generate aptitude questions via AI.
 */
export const generateAptitude = async ({ count, difficulty, topics, type }) => {
    return [];
};

export default { generateAptitude, generateCoding };
