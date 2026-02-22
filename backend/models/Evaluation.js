import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
    submissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        required: true
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamSession',
        required: true
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    scores: {
        problemUnderstanding: {
            type: Number,
            min: 0,
            max: 10,
            required: true
        },
        approachAndDataStructures: {
            type: Number,
            min: 0,
            max: 10,
            required: true
        },
        codeQualityAndLogic: {
            type: Number,
            min: 0,
            max: 10,
            required: true
        },
        edgeCasesAndComplexity: {
            type: Number,
            min: 0,
            max: 10,
            required: true
        },
        interactionAndCommunication: {
            type: Number,
            min: 0,
            max: 10,
            required: true
        },
        malpracticeRisk: {
            type: Number,
            min: 0,
            max: 10,
            required: true
        }
    },
    totalScore: {
        type: Number,
        min: 0,
        max: 50,
        required: true
    },
    strengths: [String],
    weaknesses: [String],
    detailedFeedback: {
        problemUnderstanding: String,
        approachAndDataStructures: String,
        codeQualityAndLogic: String,
        edgeCasesAndComplexity: String,
        interactionAndCommunication: String
    },
    malpracticeFlags: [{
        type: String,
        reason: String,
        severity: {
            type: String,
            enum: ['low', 'medium', 'high']
        }
    }],
    testResults: {
        totalCount: Number,
        passedCount: Number,
        results: [{
            input: String,
            expectedOutput: String,
            actualOutput: String,
            passed: Boolean,
            isHidden: Boolean
        }]
    },
    recommendation: {
        type: String,
        enum: ['Strong Yes', 'Yes', 'Borderline', 'No'],
        required: true
    },
    evaluatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate total score (inverted malpractice risk)
evaluationSchema.pre('save', function (next) {
    const { scores } = this;
    this.totalScore =
        scores.problemUnderstanding +
        scores.approachAndDataStructures +
        scores.codeQualityAndLogic +
        scores.edgeCasesAndComplexity +
        scores.interactionAndCommunication -
        scores.malpracticeRisk; // Subtract malpractice risk

    // Ensure total score is within bounds
    this.totalScore = Math.max(0, Math.min(50, this.totalScore));

    next();
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

export default Evaluation;
