
/**
 * Interview Flow Controller
 * 
 * Manages the high-level state of the interview and enforces
 * strict transitions based on candidate speech signals.
 * 
 * States:
 * - CODE_WRITING (Default)
 * - COMPLEXITY_PHASE (After candidate signals completion)
 * - COMPLETED (After complexity is answered)
 */
export class InterviewFlowController {
    constructor() {
        this.state = 'CODE_WRITING';
        this.completionSignals = [
            "completed",
            "done",
            "finished",
            "final",
            "submit",
            "code is complete",
            "i am done"
        ];
    }

    /**
     * Resets state for a new question
     */
    reset() {
        this.state = 'CODE_WRITING';
    }

    /**
     * Checks if the message contains any completion keywords
     * @param {string} message 
     * @returns {boolean}
     */
    isCompletionSignal(message) {
        if (!message) return false;
        const msg = message.toLowerCase();
        // Check strict inclusion of keywords
        // Note: 'done' is a very common word, we might want to be careful,
        // but requirements say "done" is an accepted signal.
        return this.completionSignals.some(signal => msg.includes(signal));
    }

    /**
     * Process user input based on current state.
     * Returns an action instructions for the UI/AI.
     * 
     * @param {string} userMessage 
     * @returns {object} { action: 'PASS' | 'TRANSITION' | 'FINISH', response?: string, newState?: string }
     */
    processInput(userMessage) {
        // STEP 1: Handle CODE_WRITING state
        if (this.state === 'CODE_WRITING') {
            if (this.isCompletionSignal(userMessage)) {
                this.state = 'COMPLEXITY_PHASE';
                return {
                    action: 'TRANSITION',
                    newState: 'COMPLEXITY_PHASE',
                    response: "Great. What is the time complexity of your solution, and what is the space complexity?"
                };
            }
            return { action: 'PASS' };
        }

        // STEP 2: Handle COMPLEXITY_PHASE
        if (this.state === 'COMPLEXITY_PHASE') {
            // Assume ANY answer here is their complexity answer.
            // We transition to COMPLETED (or effectively end the question).
            this.state = 'COMPLETED';
            return {
                action: 'FINISH',
                newState: 'COMPLETED',
                response: "Thank you. This question is now complete. Please submit your solution."
            };
        }

        // Default
        return { action: 'PASS' };
    }

    getState() {
        return this.state;
    }
}
