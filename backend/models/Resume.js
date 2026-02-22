import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'My Resume'
    },
    data: {
        personalInfo: {
            fullName: String,
            email: String,
            phone: String,
            linkedin: String,
            github: String,
            summary: String
        },
        education: [{
            id: Number,
            school: String,
            degree: String,
            year: String,
            score: String
        }],
        experience: [{
            id: Number,
            company: String,
            role: String,
            duration: String,
            description: String
        }],
        skills: [String],
        projects: [{
            id: Number,
            title: String,
            description: String,
            link: String
        }],
        settings: {
            themeColor: String,
            fontFamily: String,
            fontSize: String,
            templateId: String,
            spacing: Number,
            sectionOrder: [String],
            visibleSections: {
                education: Boolean,
                experience: Boolean,
                skills: Boolean,
                projects: Boolean,
                certifications: Boolean,
                achievements: Boolean
            }
        }
    }
}, { timestamps: true });

export const Resume = mongoose.model('Resume', resumeSchema);
