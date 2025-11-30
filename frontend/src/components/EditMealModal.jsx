import { useState, useEffect } from 'react';
import { updateMeal, deleteMeal, getMeals } from '../services/api';
import './AddMealModal.css';

function EditMealModal({ isOpen, onClose, onSave, meal }) {
    const [title, setTitle] = useState('');
    const [consumedAt, setConsumedAt] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && meal) {
            setTitle(meal.title || '');
            setConsumedAt(meal.consumed_at ? new Date(meal.consumed_at).toISOString().slice(0, 16) : '');
            setNotes(meal.notes || '');
            // 初始化items，确保总是有数据
            if (meal.items && Array.isArray(meal.items) && meal.items.length > 0) {
                const mappedItems = meal.items.map(item => ({
                    id: item.id,
                    food_name: item.food_name || '',
                    calories: item.calories !== null && item.calories !== undefined ? item.calories : '',
                    protein_grams: item.protein_grams !== null && item.protein_grams !== undefined ? item.protein_grams : '',
                    carbs_grams: item.carbs_grams !== null && item.carbs_grams !== undefined ? item.carbs_grams : '',
                    fat_grams: item.fat_grams !== null && item.fat_grams !== undefined ? item.fat_grams : ''
                }));
                setItems(mappedItems);
            } else {
                // 如果没有items，创建一个空项
                setItems([{ food_name: '', calories: '', protein_grams: '', carbs_grams: '', fat_grams: '' }]);
            }
        }
    }, [isOpen, meal]);

    if (!isOpen || !meal) return null;

    const handleAddItem = () => {
        setItems([...items, { 
            id: null, // 新项没有ID
            food_name: '', 
            calories: '', 
            protein_grams: '', 
            carbs_grams: '', 
            fat_grams: '' 
        }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = items.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 验证至少有一个食物项有名称
        const validItems = items.filter(item => {
            return item && 
                   item.food_name && 
                   typeof item.food_name === 'string' && 
                   item.food_name.trim().length > 0;
        });
        
        if (validItems.length === 0) {
            setError('请至少添加一个食物项');
            return;
        }
        
        // 验证标题
        if (!title.trim()) {
            setError('请选择餐食标题');
            return;
        }

        setLoading(true);

        try {
            // 格式化数据 - 确保items数组总是存在
            const mealData = {
                title: title.trim(),
                consumed_at: consumedAt,
                notes: notes.trim() || null,
                items: validItems.map((item) => {
                    // 确保数值正确转换，处理各种边界情况
                    // 使用更严格的类型检查和转换
                    const caloriesValue = item.calories;
                    const proteinValue = item.protein_grams;
                    const carbsValue = item.carbs_grams;
                    const fatValue = item.fat_grams;
                    
                    // 确保food_name不为空
                    const foodName = String(item.food_name || '').trim();
                    if (!foodName) {
                        console.warn('发现空的food_name，跳过:', item);
                        return null;
                    }
                    
                    // 数值转换：空字符串、null、undefined都转为0
                    const calories = (caloriesValue === '' || caloriesValue === null || caloriesValue === undefined || isNaN(caloriesValue)) 
                        ? 0 
                        : Math.max(0, parseInt(String(caloriesValue).replace(/[^\d.-]/g, '')) || 0);
                    const protein = (proteinValue === '' || proteinValue === null || proteinValue === undefined || isNaN(proteinValue)) 
                        ? 0 
                        : Math.max(0, parseFloat(String(proteinValue).replace(/[^\d.-]/g, '')) || 0);
                    const carbs = (carbsValue === '' || carbsValue === null || carbsValue === undefined || isNaN(carbsValue)) 
                        ? 0 
                        : Math.max(0, parseFloat(String(carbsValue).replace(/[^\d.-]/g, '')) || 0);
                    const fat = (fatValue === '' || fatValue === null || fatValue === undefined || isNaN(fatValue)) 
                        ? 0 
                        : Math.max(0, parseFloat(String(fatValue).replace(/[^\d.-]/g, '')) || 0);
                    
                    return {
                        food_name: foodName,
                        serving_size: null,
                        calories: calories,
                        protein_grams: protein,
                        carbs_grams: carbs,
                        fat_grams: fat,
                    };
                }).filter(item => item !== null) // 过滤掉null值
            };
            
            console.log('保存完成，准备刷新数据');

            let updatedMeal = null;
            
            // 如果是合并的餐食，需要更新所有相关的meal
            if (meal.isMerged && meal.mealIds && meal.mealIds.length > 1) {
                console.log('编辑合并餐食 - mealIds:', meal.mealIds);
                console.log('编辑合并餐食 - items数量:', mealData.items.length);
                console.log('编辑合并餐食 - items数据:', JSON.stringify(mealData.items, null, 2));
                
                // 更新第一个meal（包含所有items）
                updatedMeal = await updateMeal(meal.mealIds[0], mealData);
                console.log('更新后的meal:', updatedMeal);
                
                // 删除其他合并的meal（它们的items已经合并到第一个meal了）
                for (let i = 1; i < meal.mealIds.length; i++) {
                    try {
                        await deleteMeal(meal.mealIds[i]);
                        console.log(`已删除meal ${meal.mealIds[i]}`);
                    } catch (err) {
                        console.error(`删除meal ${meal.mealIds[i]} 失败:`, err);
                    }
                }
            } else {
                // 单个meal，正常更新
                console.log('编辑单个餐食 - mealId:', meal.id);
                console.log('编辑单个餐食 - items数量:', mealData.items.length);
                console.log('编辑单个餐食 - items数据:', JSON.stringify(mealData.items, null, 2));
                
                updatedMeal = await updateMeal(meal.id, mealData);
                console.log('更新后的meal:', updatedMeal);
                console.log('更新后的meal items数量:', updatedMeal?.items?.length || 0);
            }
            
            console.log('调用onSave回调');
            console.log('更新后的meal consumed_at:', updatedMeal?.consumed_at);
            
            if (onSave) {
                // 传递更新后的meal，以便刷新正确的日期
                await onSave(updatedMeal); // 确保等待保存完成
                console.log('onSave回调完成');
            }
            
            console.log('关闭编辑模态框');
            onClose();
        } catch (err) {
            console.error('保存餐食失败:', err);
            setError(err.message || '保存失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>编辑餐食</h2>
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
                            <div key={`item-${item.id || 'new'}-${index}`} className="item-row">
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

export default EditMealModal;

