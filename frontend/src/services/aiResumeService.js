import axios from 'axios';

const API_URL = 'http://localhost:5001/api/candidate';

export const getResumeSuggestions = async (section, currentContent) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            `${API_URL}/resume/suggest`,
            { section, currentContent },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data.data.suggestions;
    } catch (error) {
        console.error("AI Suggestion Error:", error);
        return ["Failed to load suggestions. Please try again."];
    }
};
