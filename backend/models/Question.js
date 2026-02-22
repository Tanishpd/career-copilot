import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Question title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Question description is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['DSA', 'SQL', 'Debugging', 'System Design', 'Aptitude'],
        default: 'DSA'
    },
    fingerprint: {
        type: String,
        unique: true,
        sparse: true // Allows null/undefined for older questions
    },
    difficulty: {
        type: String,
        required: [true, 'Difficulty is required'],
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    constraints: {
        type: String,
        default: ''
    },
    inputFormat: {
        type: String,
        default: ''
    },
    outputFormat: {
        type: String,
        default: ''
    },
    sampleInput: {
        type: String,
        default: ''
    },
    sampleOutput: {
        type: String,
        default: ''
    },
    explanation: {
        type: String,
        default: ''
    },
    options: [String],
    answer: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['MCQ', 'Fill-in-the-blank', 'Coding'],
        default: 'Coding'
    },
    structure: {
        functionName: String,
        returnType: String,
        parameters: [{
            name: String,
            type: String
        }]
    },
    codeTemplates: {
        javascript: String,
        python: String,
        java: String,
        cpp: String
    },
    testCases: [{
        input: String,
        expectedOutput: String,
        isHidden: {
            type: Boolean,
            default: false
        }
    }],
    expectedComplexity: {
        time: String,
        space: String
    },
    hints: [{
        level: Number,
        text: String
    }],
    tags: [String],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Question = mongoose.model('Question', questionSchema);

export default Question;
