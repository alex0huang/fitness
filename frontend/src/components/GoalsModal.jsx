import { useState, useEffect } from 'react';
import { getCurrentUser, updateUserGoals } from '../services/api';
import './GoalsModal.css';

function GoalsModal({ isOpen, onClose, onUpdate }) {
    const [goals, setGoals] = useState({
        daily_calorie_limit: '',
        daily_protein_limit: '',
        daily_carbs_limit: '',
        daily_fat_limit: ''
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadGoals();
        }
    }, [isOpen]);

    const loadGoals = async () => {
        try {
            setLoading(true);
            const user = await getCurrentUser();
            setGoals({
                daily_calorie_limit: user.daily_calorie_limit || '',
                daily_protein_limit: user.daily_protein_limit || '',
                daily_carbs_limit: user.daily_carbs_limit || '',
                daily_fat_limit: user.daily_fat_limit || ''
            });
        } catch (err) {
            setError(err.message || 'Failed to load goals.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const goalsData = {
                daily_calorie_limit: goals.daily_calorie_limit ? parseInt(goals.daily_calorie_limit) : null,
                daily_protein_limit: goals.daily_protein_limit ? parseFloat(goals.daily_protein_limit) : null,
                daily_carbs_limit: goals.daily_carbs_limit ? parseFloat(goals.daily_carbs_limit) : null,
                daily_fat_limit: goals.daily_fat_limit ? parseFloat(goals.daily_fat_limit) : null
            };

            await updateUserGoals(goalsData);
            if (onUpdate) {
                onUpdate();
            }
            onClose();
        } catch (err) {
            setError(err.message || 'Save failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content goals-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Daily goals</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error">{error}</div>}

                    {loading ? (
                        <div className="loading">Loading...</div>
                    ) : (
                        <>
                            <div className="goals-grid">
                                <div className="field">
                                    <label htmlFor="calories">Calories target (kcal)</label>
                                    <input
                                        type="number"
                                        id="calories"
                                        value={goals.daily_calorie_limit}
                                        onChange={(e) => setGoals({ ...goals, daily_calorie_limit: e.target.value })}
                                        placeholder="e.g. 2000"
                                        min="0"
                                    />
                                </div>

                                <div className="field">
                                    <label htmlFor="protein">Protein target (g)</label>
                                    <input
                                        type="number"
                                        id="protein"
                                        step="0.1"
                                        value={goals.daily_protein_limit}
                                        onChange={(e) => setGoals({ ...goals, daily_protein_limit: e.target.value })}
                                        placeholder="e.g. 150"
                                        min="0"
                                    />
                                </div>

                                <div className="field">
                                    <label htmlFor="carbs">Carbs target (g)</label>
                                    <input
                                        type="number"
                                        id="carbs"
                                        step="0.1"
                                        value={goals.daily_carbs_limit}
                                        onChange={(e) => setGoals({ ...goals, daily_carbs_limit: e.target.value })}
                                        placeholder="e.g. 200"
                                        min="0"
                                    />
                                </div>

                                <div className="field">
                                    <label htmlFor="fat">Fat target (g)</label>
                                    <input
                                        type="number"
                                        id="fat"
                                        step="0.1"
                                        value={goals.daily_fat_limit}
                                        onChange={(e) => setGoals({ ...goals, daily_fat_limit: e.target.value })}
                                        placeholder="e.g. 65"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="goals-tip">
                                <p>Tip: you can set only the goals you care about—progress bars show only for targets you set.</p>
                            </div>
                        </>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default GoalsModal;

