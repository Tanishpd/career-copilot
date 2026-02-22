
/**
 * Save Resume
 */
export const saveResume = async (req, res) => {
    try {
        const { id, title, data } = req.body;

        if (id) {
            // Update existing
            const resume = await Resume.findOneAndUpdate(
                { _id: id, user: req.user.id },
                { title, data },
                { new: true }
            );

            if (!resume) {
                return res.status(404).json({ success: false, message: 'Resume not found' });
            }

            return res.status(200).json({ success: true, data: { resume } });
        } else {
            // Create new
            const resume = await Resume.create({
                user: req.user.id,
                title: title || 'My Resume',
                data
            });

            return res.status(201).json({ success: true, data: { resume } });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error saving resume', error: error.message });
    }
};

/**
 * Get All Resumes for User
 */
export const getResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({ user: req.user.id })
            .select('title updatedAt createdAt')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: { resumes } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching resumes', error: error.message });
    }
};

/**
 * Get Single Resume
 */
export const getResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        res.status(200).json({ success: true, data: { resume } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching resume', error: error.message });
    }
};

/**
 * Delete Resume
 */
export const deleteResume = async (req, res) => {
    try {
        const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user.id });

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        res.status(200).json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting resume', error: error.message });
    }
};
