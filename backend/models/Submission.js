import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamSession',
        required: true
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: 'javascript'
    },
    explanation: {
        type: String,
        default: ''
    },
    approach: {
        type: String,
        default: ''
    },
    attempts: {
        type: Number,
        default: 1
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0
    },
    passed: {
        type: Boolean,
        default: false
    },
    testCasesPassed: {
        type: Number,
        default: 0
    },
    totalTestCases: {
        type: Number,
        default: 0
    },
    hintsUsed: {
        type: Number,
        default: 0
    },
    interactionHistory: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['ai-question', 'candidate-response', 'code-change', 'hint-requested', 'ai-greeting', 'ai-explanation', 'ai-hint', 'ai-reply']
        },
        content: String,
        metadata: mongoose.Schema.Types.Mixed
    }],
    codeChanges: [{
        timestamp: Date,
        code: String,
        changeType: {
            type: String,
            enum: ['incremental', 'major-rewrite', 'paste']
        }
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Track suspicious patterns
submissionSchema.methods.detectSuspiciousPatterns = function () {
    const flags = [];

    // Check for sudden complete code (possible paste)
    if (this.codeChanges.length > 0) {
        const majorRewrites = this.codeChanges.filter(c => c.changeType === 'major-rewrite' || c.changeType === 'paste');
        if (majorRewrites.length > 0) {
            flags.push('sudden-complete-code');
        }
    }

    // Check for low interaction with high code quality
    if (this.interactionHistory.length < 3 && this.code.length > 200) {
        flags.push('low-interaction-high-code');
    }

    return flags;
};

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
