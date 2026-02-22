
/**
 * Code Analyzer Middle Layer
 * 
 * Intercepts raw editor events prevents code spam from reaching the AI.
 * 
 * Features:
 * 1. Debounce (Stability)
 * 2. Block Completion Check
 * 3. Logic Intent Detection
 * 4. Structured Signal Emission
 */
export class CodeAnalyzer {
    constructor(onSignal) {
        this.onSignal = onSignal; // Callback to send structured data to AI
        this.timer = null;
        this.previousCode = "";
        this.explainedIntents = {
            ACCUMULATION: false,
            LOOP: false,
            CONDITION: false,
            MAX_MIN: false,
            FUNCTION_DEF: false
        };
        this.DEBOUNCE_MS = 800;
    }

    /**
     * Main entry point for editor changes.
     * Call this on every keystroke/change event.
     * @param {string} newCode 
     */
    handleCodeChange(newCode) {
        // 1. Debounce
        if (this.timer) clearTimeout(this.timer);

        this.timer = setTimeout(() => {
            this.analyze(newCode);
        }, this.DEBOUNCE_MS);
    }

    /**
     * Internal analysis logic
     */
    analyze(code) {
        // 2. Block Completion Check
        if (!this.isBlockComplete(code)) {
            console.log('[Analyzer] Block incomplete, skipping analysis.');
            return;
        }

        // 3. Difference-Based Analysis
        const addedCode = this.getNewLines(this.previousCode, code);

        // If nothing substantial added, just update reference and exit
        if (!addedCode) {
            this.previousCode = code;
            return;
        }

        console.log('[Analyzer] Analyzing added code:', addedCode);

        // 4. Intent Detection
        const intent = this.detectLogic(addedCode);

        // 5. Logic Memory Check (Avoid Repetition)
        if (intent && !this.explainedIntents[intent]) {
            console.log('[Analyzer] New Intent Detected:', intent);

            // Mark as explained so we don't spam 
            // (In a real app, you might want to reset this if context changes significantly)
            this.explainedIntents[intent] = true;

            // 6. Emit Structured Signal
            this.onSignal({
                type: 'LOGIC_INTENT',
                intent,
                codeSnippet: addedCode,
                fullCode: code
            });
        }
        else if (intent && this.explainedIntents[intent]) {
            console.log('[Analyzer] Intent already explained:', intent);
        }
        else {
            console.log('[Analyzer] No specific logic intent detected.');
        }

        // Update previous code reference
        this.previousCode = code;
    }

    isBlockComplete(code) {
        const open = (code.match(/{/g) || []).length;
        const close = (code.match(/}/g) || []).length;
        return open === close;
    }

    getNewLines(oldCode, newCode) {
        // Simple diff: strictly strictly what's added at the end or changed
        // For a more robust diff, we'd use a library, but this suffices for "typing forward"
        if (newCode.length <= oldCode.length) return null;
        if (newCode.startsWith(oldCode)) {
            return newCode.substring(oldCode.length).trim();
        }
        // Fallback: if user pasted in middle or deleted+typed, just return full new code
        // or a dumb heuristic. Let's return the whole new code if structure changed drastically.
        return newCode;
    }

    detectLogic(snippet) {
        // Normalize
        const s = snippet.toLowerCase();

        // Accumulation
        if (s.includes('+=') || s.match(/\w+\s*=\s*\w+\s*\+\s*\w+/)) return 'ACCUMULATION';

        // Counting / Increment
        if (s.includes('++') || s.includes('--')) return 'ACCUMULATION'; // Broadly accumulation logic

        // Loops
        if (s.includes('for(') || s.includes('for (') || s.includes('while(')) return 'LOOP';

        // Conditions
        if (s.includes('if(') || s.includes('if (') || s.includes('else')) return 'CONDITION';

        // Math Min/Max
        if (s.includes('math.max') || s.includes('math.min')) return 'MAX_MIN';

        // Function Definition
        if (s.includes('function ') || s.includes('=>')) return 'FUNCTION_DEF';

        return null;
    }

    reset() {
        this.previousCode = "";
        this.explainedIntents = {
            ACCUMULATION: false,
            LOOP: false,
            CONDITION: false,
            MAX_MIN: false,
            FUNCTION_DEF: false
        };
    }
}
