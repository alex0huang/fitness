import { useState, useEffect } from 'react';
import './AddMealModal.css';

function AddMealModal({ isOpen, onClose, onSave, defaultDate }) {
    const getDefaultDateTime = () => {
        if (defaultDate) {
            // 如果提供了日期，使用该日期的当前时间
            const date = new Date(defaultDate);
            const now = new Date();
            date.setHours(now.getHours(), now.getMinutes());
            return date.toISOString().slice(0, 16);
        }
        return new Date().toISOString().slice(0, 16);
    };

    const [title, setTitle] = useState('');
    const [consumedAt, setConsumedAt] = useState(getDefaultDateTime());
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setConsumedAt(getDefaultDateTime());
            setTitle(''); // 重置标题
        }
    }, [isOpen, defaultDate]);
    const [items, setItems] = useState([
        { food_name: '', calories: '', protein_grams: '', carbs_grams: '', fat_grams: '' }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleAddItem = () => {
        setItems([...items, { food_name: '', calories: '', protein_grams: '', carbs_grams: '', fat_grams: '' }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 验证至少有一个食物项有名称
        const validItems = items.filter(item => item.food_name.trim());
        if (validItems.length === 0) {
            setError('请至少添加一个食物项');
            return;
        }

        // 验证标题
        if (!title.trim()) {
            setError('请输入餐食标题');
            return;
        }

        setLoading(true);

        try {
            // 格式化数据
            const mealData = {
                title: title.trim(),
                consumed_at: consumedAt,
                notes: notes.trim() || null,
                items: validItems.map(item => ({
                    food_name: item.food_name.trim(),
                    serving_size: null,
                    calories: parseInt(item.calories) || 0,
                    protein_grams: parseFloat(item.protein_grams) || 0,
                    carbs_grams: parseFloat(item.carbs_grams) || 0,
                    fat_grams: parseFloat(item.fat_grams) || 0,
                }))
            };

            await onSave(mealData);
            
            // 重置表单
            setTitle('');
            setConsumedAt(getDefaultDateTime());
            setNotes('');
            setItems([{ food_name: '', calories: '', protein_grams: '', carbs_grams: '', fat_grams: '' }]);
            onClose();
        } catch (err) {
            setError(err.message || '保存失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>添加餐食</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error">{error}</div>}

                    <div className="field">
                        <label htmlFor="title">餐食标题 *</label>
                        <select
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="title-select"
                        >
                            <option value="">请选择</option>
                            <option value="早餐">早餐</option>
                            <option value="午餐">午餐</option>
                            <option value="晚餐">晚餐</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="consumedAt">用餐时间</label>
                        <input
                            type="datetime-local"
                            id="consumedAt"
                            value={consumedAt}
                            onChange={(e) => setConsumedAt(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="notes">备注</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="可选备注信息"
                            rows="3"
                        />
                    </div>

                    <div className="items-section">
                        <div className="items-header">
                            <label>食物项 *</label>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
                                + 添加食物
                            </button>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="item-row">
                                <div className="item-fields">
                                    <input
                                        type="text"
                                        placeholder="食物名称 *"
                                        value={item.food_name}
                                        onChange={(e) => handleItemChange(index, 'food_name', e.target.value)}
                                        className="item-food-name"
                                    />
                                    <input
                                        type="number"
                                        placeholder="卡路里"
                                        value={item.calories}
                                        onChange={(e) => handleItemChange(index, 'calories', e.target.value)}
                                        className="item-nutrition item-calories"
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="蛋白质(g)"
                                        value={item.protein_grams}
                                        onChange={(e) => handleItemChange(index, 'protein_grams', e.target.value)}
                                        className="item-nutrition item-protein"
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="碳水(g)"
                                        value={item.carbs_grams}
                                        onChange={(e) => handleItemChange(index, 'carbs_grams', e.target.value)}
                                        className="item-nutrition item-carbs"
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="脂肪(g)"
                                        value={item.fat_grams}
                                        onChange={(e) => handleItemChange(index, 'fat_grams', e.target.value)}
                                        className="item-nutrition item-fat"
                                    />
                                </div>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn-remove-item"
                                        onClick={() => handleRemoveItem(index)}
                                    >
                                        删除
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            取消
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddMealModal;

