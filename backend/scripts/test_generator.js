
import 'dotenv/config'; // Load env vars
import { generateCoding } from '../services/aiQuestionGenerator.js';
import aiInterviewer from '../services/aiInterviewer.js';

// Mock the callAI function to intercept prompts
aiInterviewer.callAI = async (prompt) => {
    console.log("\n[MOCK AI] Received Prompt Snippet:");
    console.log(prompt.substring(0, 300) + "..."); // Print first 300 chars to check Topic/Scenario

    // Return a dummy JSON to satisfy the parser
    if (prompt.includes("Generate ONE unique")) {
        // This is generateIdea
        return JSON.stringify({ topic: "Test Topic", idea: "A test idea involving a scenario." });
    }
    if (prompt.includes("generate a FULL and DETAILED")) {
        // This is expandQuestion
        return JSON.stringify({
            problem: {
                title: "Mocked Title",
                description: "Mocked Description",
                inputFormat: "txt",
                outputFormat: "txt",
                examples: [{ input: "a", output: "b" }, { input: "c", output: "d" }],
                constraints: ["none"]
            },
            testCases: { visible: [], hidden: [] },
            structure: {},
            codeTemplates: {}
        });
    }
    return "{}";
};

async function test() {
    console.log("=== TEST START: Verifying Prompts ===");

    console.log("\n--- TRIGGERING EASY (Should match Maze/Graph) ---");
    await generateCoding({ count: 1, difficulty: 'Easy' });

    console.log("\n--- TRIGGERING HARD (Should match Job Scheduling) ---");
    await generateCoding({ count: 1, difficulty: 'Hard' });
}

test();
