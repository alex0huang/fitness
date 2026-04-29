import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeals, logout, createMeal, getCurrentUser, deleteMeal } from '../services/api';
import AddMealModal from '../components/AddMealModal';
import EditMealModal from '../components/EditMealModal';
import GoalsModal from '../components/GoalsModal';
import { getLocalDateString, getTodayLocalDateString } from '../utils/dateUtils';
import '../styles/global.css';
import './Dashboard.css';

function Dashboard() {
    const [selectedDate, setSelectedDate] = useState(getTodayLocalDateString());
    const [meals, setMeals] = useState([]);
    const [userGoals, setUserGoals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    const [showGoalsModal, setShowGoalsModal] = useState(false);
    const navigate = useNavigate();

    const checkAuth = useCallback(async () => {
        try {
            const user = await getCurrentUser();
            console.log('Current user:', user);
        } catch (err) {
            console.error('Auth check failed:', err);
            if (err.message.includes('Unauthorized') || err.message.includes('未授权') || err.message.includes('401')) {
                navigate('/users/login');
            }
        }
    }, [navigate]);

    const loadUserGoals = useCallback(async () => {
        try {
            const user = await getCurrentUser();
            setUserGoals({
                daily_calorie_limit: user.daily_calorie_limit,
                daily_protein_limit: user.daily_protein_limit,
                daily_carbs_limit: user.daily_carbs_limit,
                daily_fat_limit: user.daily_fat_limit
            });
        } catch (err) {
            console.error('Failed to load user goals:', err);
        }
    }, []);

    const loadMeals = useCallback(async (date = selectedDate) => {
        try {
            setLoading(true);
            console.log('loadMeals - loading, date:', date);
            const data = await getMeals(date);
            console.log('loadMeals - data:', data);
            console.log('loadMeals - count:', data.length);
            // 检查meal 30的数据
            const meal30 = data.find(m => m.id === 30);
            if (meal30) {
                console.log('loadMeals - meal 30:', meal30);
                console.log('loadMeals - meal 30 items count:', meal30.items?.length || 0);
                console.log('loadMeals - meal 30 items:', meal30.items);
            } else {
                console.log('loadMeals - meal 30 not found');
            }
            setMeals(data);
        } catch (err) {
            console.error('loadMeals - failed:', err);
            if (err.message.includes('Unauthorized') || err.message.includes('未授权') || err.message.includes('401')) {
                navigate('/users/login');
            } else {
                // 显示更友好的错误信息
                const errorMessage = err.message || 'Failed to load meals.';
                setError(errorMessage);
                // 如果是网络错误，5秒后自动清除错误信息
                if (errorMessage.includes('Network') || errorMessage.includes('网络') || errorMessage.includes('timeout') || errorMessage.includes('超时')) {
                    setTimeout(() => setError(''), 5000);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, selectedDate]);

    useEffect(() => {
        checkAuth();
        loadUserGoals();
        loadMeals(selectedDate);
    }, [checkAuth, loadMeals, loadUserGoals, selectedDate]);

    useEffect(() => {
        loadMeals(selectedDate);
    }, [loadMeals, selectedDate]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/users/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const handleSaveMeal = async (mealData) => {
        await createMeal(mealData);
        await loadMeals();
    };

    const handleEditMeal = (meal) => {
        // 如果是合并的餐食，使用合并后的数据
        // 但需要保存所有原始meal IDs以便更新
        const mealToEdit = {
            ...meal,
            isMerged: meal.mealCount > 1,
            mealIds: meal.mealIds || [meal.id],
            originalMeals: meal.originalMeals || [meal]
        };
        
        // 确保items存在且是数组
        if (!mealToEdit.items || !Array.isArray(mealToEdit.items)) {
            mealToEdit.items = [];
        }
        
        setEditingMeal(mealToEdit);
        setShowEditModal(true);
    };

    const handleUpdateMeal = async (updatedMeal) => {
        console.log('handleUpdateMeal called, refreshing data');
        console.log('updatedMeal:', updatedMeal);
        
        // 如果更新后的meal有consumed_at，检查是否需要切换日期
        let dateToLoad = selectedDate;
        if (updatedMeal && updatedMeal.consumed_at) {
            // 使用统一的日期工具函数处理时区问题
            const mealDateLocal = getLocalDateString(updatedMeal.consumed_at);
            console.log('updated meal UTC date:', new Date(updatedMeal.consumed_at).toISOString().split('T')[0]);
            console.log('updated meal local date:', mealDateLocal);
            console.log('current selected date:', selectedDate);
            
            // 如果日期不同，使用meal的本地日期来加载数据
            if (mealDateLocal && mealDateLocal !== selectedDate) {
                console.log('date mismatch, loading meal date:', mealDateLocal);
                dateToLoad = mealDateLocal;
                // 同时更新选中的日期
                setSelectedDate(mealDateLocal);
            }
        }
        
        // 等待一下确保后端更新完成
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('first refresh, date:', dateToLoad);
        
        // 多次尝试刷新，确保数据同步
        let refreshedData = [];
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                refreshedData = await getMeals(dateToLoad);
                console.log(`refresh attempt ${retryCount + 1} - count:`, refreshedData.length);
                
                // 检查更新后的meal是否存在
                if (updatedMeal) {
                    const foundMeal = refreshedData.find(m => m.id === updatedMeal.id);
                    if (foundMeal) {
                        console.log('found updated meal:', foundMeal.id);
                        console.log('meal items count:', foundMeal.items?.length || 0);
                        if (foundMeal.items && foundMeal.items.length > 0) {
                            console.log('meal items:', foundMeal.items.map(i => i.food_name));
                        } else {
                            console.warn('Warning: meal exists but has no items!');
                            // 如果meal存在但没有items，等待一下再试
                            if (retryCount < maxRetries - 1) {
                                await new Promise(resolve => setTimeout(resolve, 200));
                                retryCount++;
                                continue;
                            }
                        }
                        break; // 找到了，退出循环
                    } else {
                        console.log(`refresh attempt ${retryCount + 1} - updated meal not found: ${updatedMeal.id}`);
                        if (retryCount < maxRetries - 1) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                            retryCount++;
                            continue;
                        }
                    }
                } else {
                    break; // 没有updatedMeal，直接退出
                }
            } catch (err) {
                console.error(`refresh attempt ${retryCount + 1} failed:`, err);
                if (retryCount < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    retryCount++;
                    continue;
                }
                throw err;
            }
        }
        
        console.log('final refreshed count:', refreshedData.length);
        setMeals(refreshedData);
    };

    const handleDeleteMeal = async (mealId) => {
        if (window.confirm('Delete this meal entry?')) {
            try {
                await deleteMeal(mealId);
                await loadMeals();
            } catch (err) {
                setError(err.message || 'Delete failed.');
            }
        }
    };

    const handleUpdateGoals = async () => {
        try {
            const user = await getCurrentUser();
            setUserGoals({
                daily_calorie_limit: user.daily_calorie_limit,
                daily_protein_limit: user.daily_protein_limit,
                daily_carbs_limit: user.daily_carbs_limit,
                daily_fat_limit: user.daily_fat_limit
            });
        } catch (err) {
            console.error('Failed to refresh user goals:', err);
        }
    };

    const formatDateShort = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 计算选中日期的统计，并按餐食类型合并
    // 注意：后端已经按日期过滤了，所以这里不需要再次过滤
    // 但为了安全起见，还是保留过滤逻辑
    const selectedDateMeals = meals.filter(meal => {
        // 使用UTC日期匹配（因为后端存储的是UTC时间）
        const mealDateUTC = getLocalDateString(meal.consumed_at);
        return mealDateUTC === selectedDate;
    });

    // 按餐食标题分组并合并
    const groupedMeals = selectedDateMeals.reduce((acc, meal) => {
        const title = meal.title || 'Other';
        if (!acc[title]) {
            acc[title] = {
                id: meal.id, // 使用第一个餐食的ID
                mealIds: [], // 保存所有原始meal IDs
                title: title,
                consumed_at: meal.consumed_at,
                notes: meal.notes || '',
                items: [],
                total_calories: 0,
                total_protein: 0,
                total_carbs: 0,
                total_fat: 0,
                mealCount: 0,
                originalMeals: [] // 保存所有原始meal对象
            };
        }
        
        // 保存原始meal ID和对象
        acc[title].mealIds.push(meal.id);
        acc[title].originalMeals.push(meal);
        
        // 合并食物项 - 确保items数组存在且有效
        if (meal.items && Array.isArray(meal.items) && meal.items.length > 0) {
            // 确保每个item都有必要的字段
            const validItems = meal.items.filter(item => 
                item && 
                item.food_name && 
                typeof item.food_name === 'string' && 
                item.food_name.trim().length > 0
            );
            if (validItems.length > 0) {
                acc[title].items.push(...validItems);
            }
        }
        
        // 合并营养数据
        acc[title].total_calories += parseFloat(meal.total_calories || 0);
        acc[title].total_protein += parseFloat(meal.total_protein || 0);
        acc[title].total_carbs += parseFloat(meal.total_carbs || 0);
        acc[title].total_fat += parseFloat(meal.total_fat || 0);
        acc[title].mealCount += 1;
        
        // 合并备注（如果有多个，用换行分隔）
        if (meal.notes && meal.notes.trim()) {
            if (acc[title].notes) {
                acc[title].notes += '\n' + meal.notes;
            } else {
                acc[title].notes = meal.notes;
            }
        }
        
        return acc;
    }, {});

    // 转换为数组并按时间排序
    const mergedMeals = Object.values(groupedMeals).sort((a, b) => {
        return new Date(a.consumed_at) - new Date(b.consumed_at);
    });

    const dayStats = mergedMeals.reduce((acc, meal) => {
        acc.calories += parseFloat(meal.total_calories || 0);
        acc.protein += parseFloat(meal.total_protein || 0);
        acc.carbs += parseFloat(meal.total_carbs || 0);
        acc.fat += parseFloat(meal.total_fat || 0);
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // 计算进度百分比
    const getProgress = (current, target) => {
        if (!target || target === 0) return null;
        const percentage = (current / target) * 100;
        return Math.min(percentage, 100);
    };

    const formatDateDisplay = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (dateString === today.toISOString().split('T')[0]) {
            return 'Today';
        } else if (dateString === yesterday.toISOString().split('T')[0]) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        }
    };

    const displayMealTitle = (title) => {
        const normalized = String(title || '').trim();
        if (!normalized) return 'Other';
        const map = {
            '早餐': 'Breakfast',
            '午餐': 'Lunch',
            '晚餐': 'Dinner',
            '其他': 'Other',
            Breakfast: 'Breakfast',
            Lunch: 'Lunch',
            Dinner: 'Dinner',
            Other: 'Other'
        };
        return map[normalized] || normalized;
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="brand">
                        <span>FT</span> Fitness Tracker
                    </div>
                    <nav>
                        <button onClick={() => setShowGoalsModal(true)} className="btn btn-secondary">
                            Goals
                        </button>
                        <button onClick={handleLogout} className="btn btn-secondary">
                            Log out
                        </button>
                    </nav>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-container">
                    <div className="dashboard-header-section">
                        <h1>My log</h1>
                        <div className="date-selector">
                            <label htmlFor="date-select">Date</label>
                            <input
                                type="date"
                                id="date-select"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="date-input"
                            />
                        </div>
                    </div>

                    {/* 日期显示 */}
                    <div className="date-display">
                        <h2>{formatDateDisplay(selectedDate)}</h2>
                    </div>

                    {/* 目标对比统计卡片 */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-label">Calories</div>
                                <div className="stat-target">
                                    {userGoals?.daily_calorie_limit ? `/ ${userGoals.daily_calorie_limit} kcal` : ''}
                                </div>
                            </div>
                            <div className="stat-value">{Math.round(dayStats.calories)}</div>
                            <div className="stat-unit">kcal</div>
                            {userGoals?.daily_calorie_limit && (
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${getProgress(dayStats.calories, userGoals.daily_calorie_limit)}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-label">Protein</div>
                                <div className="stat-target">
                                    {userGoals?.daily_protein_limit ? `/ ${userGoals.daily_protein_limit}g` : ''}
                                </div>
                            </div>
                            <div className="stat-value">{Math.round(dayStats.protein)}</div>
                            <div className="stat-unit">g</div>
                            {userGoals?.daily_protein_limit && (
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${getProgress(dayStats.protein, userGoals.daily_protein_limit)}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-label">Carbs</div>
                                <div className="stat-target">
                                    {userGoals?.daily_carbs_limit ? `/ ${userGoals.daily_carbs_limit}g` : ''}
                                </div>
                            </div>
                            <div className="stat-value">{Math.round(dayStats.carbs)}</div>
                            <div className="stat-unit">g</div>
                            {userGoals?.daily_carbs_limit && (
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${getProgress(dayStats.carbs, userGoals.daily_carbs_limit)}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-label">Fat</div>
                                <div className="stat-target">
                                    {userGoals?.daily_fat_limit ? `/ ${userGoals.daily_fat_limit}g` : ''}
                                </div>
                            </div>
                            <div className="stat-value">{Math.round(dayStats.fat)}</div>
                            <div className="stat-unit">g</div>
                            {userGoals?.daily_fat_limit && (
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${getProgress(dayStats.fat, userGoals.daily_fat_limit)}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 添加餐食按钮 */}
                    <div className="action-bar">
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            + Add meal
                        </button>
                    </div>

                    {/* 错误提示 */}
                    {error && <div className="error">{error}</div>}

                    {/* 餐食列表 - 只显示选中日期的，相同类型合并显示 */}
                    {loading ? (
                        <div className="loading">Loading...</div>
                    ) : mergedMeals.length === 0 ? (
                        <div className="empty-state">
                            <p>No meals logged for {formatDateDisplay(selectedDate)}.</p>
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                Add your first meal
                            </button>
                        </div>
                    ) : (
                        <div className="meals-list">
                            {mergedMeals.map((meal) => (
                                <div key={meal.id} className="meal-card">
                                    <div className="meal-header">
                                        <div className="meal-title-row">
                                            <h3>
                                                {displayMealTitle(meal.title)}
                                                {meal.mealCount > 1 && (
                                                    <span className="meal-count-badge">({meal.mealCount}x)</span>
                                                )}
                                            </h3>
                                            <span className="meal-time">
                                                {formatDateShort(meal.consumed_at)}
                                            </span>
                                        </div>
                                        <div className="meal-actions">
                                            <button 
                                                className="btn-edit-meal"
                                                onClick={() => handleEditMeal(meal)}
                                                title="Edit"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="btn-delete-meal"
                                                onClick={() => handleDeleteMeal(meal.id)}
                                                title="Delete"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    {meal.notes && (
                                        <p className="meal-notes">{meal.notes}</p>
                                    )}
                                    {/* 显示食物项列表 */}
                                    {meal.items && meal.items.length > 0 && (
                                        <div className="meal-items">
                                            <div className="meal-items-label">Items</div>
                                            <div className="meal-items-list">
                                                {meal.items.map((item, index) => (
                                                    <span key={item.id || index} className="meal-item-tag">
                                                        {item.food_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="meal-stats">
                                        <span className="meal-stat">
                                            <strong>{Math.round(meal.total_calories || 0)}</strong> kcal
                                        </span>
                                        <span className="meal-stat">
                                            Protein <strong>{Math.round(meal.total_protein || 0)}</strong>g
                                        </span>
                                        <span className="meal-stat">
                                            Carbs <strong>{Math.round(meal.total_carbs || 0)}</strong>g
                                        </span>
                                        <span className="meal-stat">
                                            Fat <strong>{Math.round(meal.total_fat || 0)}</strong>g
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* 添加餐食模态框 */}
            <AddMealModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleSaveMeal}
                defaultDate={selectedDate}
            />

            {/* 编辑餐食模态框 */}
            <EditMealModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingMeal(null);
                }}
                onSave={handleUpdateMeal}
                meal={editingMeal}
            />

            {/* 设置目标模态框 */}
            <GoalsModal
                isOpen={showGoalsModal}
                onClose={() => setShowGoalsModal(false)}
                onUpdate={handleUpdateGoals}
            />
        </div>
    );
}

export default Dashboard;
