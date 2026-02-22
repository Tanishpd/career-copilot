import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        default: () => `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedQuestions: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        order: Number,
        draftCode: {
            type: String,
            default: ''
        },
        language: {
            type: String,
            default: 'javascript'
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'expired'],
        default: 'pending'
    },
    startTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        default: null
    },
    warningCount: {
        type: Number,
        default: 0
    },
    violations: [{
        type: {
            type: String,
            enum: ['fullscreen_exit', 'tab_switch', 'copy_paste', 'other']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        metadata: String
    }],
    timeLimit: {
        type: Number, // in minutes
        default: 120
    },
    allowHints: {
        type: Boolean,
        default: true
    },
    maxHintsPerQuestion: {
        type: Number,
        default: 2
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    interviewFlow: {
        currentStage: {
            type: String,
            enum: ['INTRODUCTION', 'PROBLEM_EXPLANATION', 'APPROACH', 'DATA_STRUCTURE', 'LOGIC_JUSTIFICATION', 'CODE_WRITING', 'EDGE_CASES', 'COMPLEXITY', 'COMPLETED', 'TECHNICAL_SCREEN', 'CODING_CHALLENGE', 'LINE_EXPLANATION'],
            default: 'INTRODUCTION'
        },
        flags: {
            intro_done: { type: Boolean, default: false },
            problem_explained: { type: Boolean, default: false },
            approach_done: { type: Boolean, default: false },
            datastruct_done: { type: Boolean, default: false },
            logic_done: { type: Boolean, default: false },
            code_started: { type: Boolean, default: false },
            code_completed: { type: Boolean, default: false },
            complexity_done: { type: Boolean, default: false }
        },
        conversationHistory: [{
            role: { type: String, enum: ['ai', 'candidate'] },
            content: String,
            timestamp: { type: Date, default: Date.now }
        }],
        candidateContext: {
            name: String,
            skills: [String],
            summary: String,
            experience: [String]
        }
    }
}, {
    timestamps: true
});

// Auto-expire sessions after time limit
examSessionSchema.methods.checkExpiration = function () {
    if (this.startTime && this.timeLimit) {
        const expirationTime = new Date(this.startTime.getTime() + this.timeLimit * 60000);
        if (new Date() > expirationTime && this.status === 'in-progress') {
            this.status = 'expired';
            this.endTime = expirationTime;
            return true;
        }
    }
    return false;
};

const ExamSession = mongoose.model('ExamSession', examSessionSchema);

export default ExamSession;
