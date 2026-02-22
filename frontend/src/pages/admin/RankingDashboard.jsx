import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';

export const RankingDashboard = () => {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRankings();
    }, []);

    const loadRankings = async () => {
        try {
            const response = await adminAPI.getRankings();
            setRankings(response.data.data.rankings);
        } catch (error) {
            console.error('Error loading rankings:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Candidate Rankings</h1>
                <p className="text-muted">Leaderboard based on average scores</p>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Rank</th>
                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Candidate</th>
                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>Avg Score</th>
                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>Submissions</th>
                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>Malpractice</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((ranking, index) => (
                            <tr key={ranking.candidate._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: 'var(--spacing-md)' }}>
                                    <span className="font-bold text-primary">#{index + 1}</span>
                                </td>
                                <td style={{ padding: 'var(--spacing-md)' }}>
                                    <div>
                                        <p className="font-semibold">{ranking.candidate.name}</p>
                                        <p className="text-muted text-sm">{ranking.candidate.email}</p>
                                    </div>
                                </td>
                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                    <span className="font-bold text-primary">{ranking.averageScore}/50</span>
                                </td>
                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                    {ranking.totalSubmissions}
                                </td>
                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                    {ranking.malpracticeCount > 0 ? (
                                        <span className="badge badge-danger">{ranking.malpracticeCount}</span>
                                    ) : (
                                        <span className="text-success">✓</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
