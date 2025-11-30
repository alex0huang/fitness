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
            setError(err.message || '加载目标失败');
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
            setError(err.message || '保存失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content goals-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>设置每日目标</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error">{error}</div>}

                    {loading ? (
                        <div className="loading">加载中...</div>
                    ) : (
                        <>
                            <div className="goals-grid">
                                <div className="field">
                                    <label htmlFor="calories">每日卡路里目标 (kcal)</label>
                                    <input
                                        type="number"
                                        id="calories"
                                        value={goals.daily_calorie_limit}
                                        onChange={(e) => setGoals({ ...goals, daily_calorie_limit: e.target.value })}
                                        placeholder="例如：2000"
                                        min="0"
                                    />
                                </div>

                                <div className="field">
                                    <label htmlFor="protein">每日蛋白质目标 (g)</label>
                                    <input
                                        type="number"
                                        id="protein"
                                        step="0.1"
                                        value={goals.daily_protein_limit}
                                        onChange={(e) => setGoals({ ...goals, daily_protein_limit: e.target.value })}
                                        placeholder="例如：150"
                                        min="0"
                                    />
                                </div>

                                <div className="field">
                                    <label htmlFor="carbs">每日碳水化合物目标 (g)</label>
                                    <input
                                        type="number"
                                        id="carbs"
                                        step="0.1"
                                        value={goals.daily_carbs_limit}
                                        onChange={(e) => setGoals({ ...goals, daily_carbs_limit: e.target.value })}
                                        placeholder="例如：200"
                                        min="0"
                                    />
                                </div>

                                <div className="field">
                                    <label htmlFor="fat">每日脂肪目标 (g)</label>
                                    <input
                                        type="number"
                                        id="fat"
                                        step="0.1"
                                        value={goals.daily_fat_limit}
                                        onChange={(e) => setGoals({ ...goals, daily_fat_limit: e.target.value })}
                                        placeholder="例如：65"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="goals-tip">
                                <p>💡 提示：你可以只设置部分目标，未设置的项目将不显示进度条。</p>
                            </div>
                        </>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                            取消
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || saving}>
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default GoalsModal;

