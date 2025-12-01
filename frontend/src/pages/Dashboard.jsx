import { useState, useEffect } from 'react';
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

    useEffect(() => {
        // 先检查登录状态
        checkAuth();
        loadUserGoals();
        loadMeals();
    }, []);

    const checkAuth = async () => {
        try {
            const user = await getCurrentUser();
            console.log('当前用户:', user);
        } catch (err) {
            console.error('认证检查失败:', err);
            if (err.message.includes('未授权') || err.message.includes('401')) {
                navigate('/users/login');
            }
        }
    };

    useEffect(() => {
        loadMeals();
    }, [selectedDate]);

    const loadUserGoals = async () => {
        try {
            const user = await getCurrentUser();
            setUserGoals({
                daily_calorie_limit: user.daily_calorie_limit,
                daily_protein_limit: user.daily_protein_limit,
                daily_carbs_limit: user.daily_carbs_limit,
                daily_fat_limit: user.daily_fat_limit
            });
        } catch (err) {
            console.error('加载用户目标失败:', err);
        }
    };

    const loadMeals = async () => {
        try {
            setLoading(true);
            console.log('loadMeals - 开始加载，日期:', selectedDate);
            const data = await getMeals(selectedDate);
            console.log('loadMeals - 加载到的数据:', data);
            console.log('loadMeals - 数据数量:', data.length);
            // 检查meal 30的数据
            const meal30 = data.find(m => m.id === 30);
            if (meal30) {
                console.log('loadMeals - meal 30的数据:', meal30);
                console.log('loadMeals - meal 30的items数量:', meal30.items?.length || 0);
                console.log('loadMeals - meal 30的items:', meal30.items);
            } else {
                console.log('loadMeals - 未找到meal 30');
            }
            setMeals(data);
        } catch (err) {
            console.error('loadMeals - 加载失败:', err);
            if (err.message.includes('未授权') || err.message.includes('401')) {
                navigate('/users/login');
            } else {
                // 显示更友好的错误信息
                const errorMessage = err.message || '加载餐食记录失败';
                setError(errorMessage);
                // 如果是网络错误，5秒后自动清除错误信息
                if (errorMessage.includes('网络') || errorMessage.includes('超时')) {
                    setTimeout(() => setError(''), 5000);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/users/login');
        } catch (err) {
            console.error('登出失败:', err);
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
        console.log('handleUpdateMeal 被调用，开始刷新数据');
        console.log('updatedMeal:', updatedMeal);
        
        // 如果更新后的meal有consumed_at，检查是否需要切换日期
        let dateToLoad = selectedDate;
        if (updatedMeal && updatedMeal.consumed_at) {
            // 使用统一的日期工具函数处理时区问题
            const mealDateLocal = getLocalDateString(updatedMeal.consumed_at);
            console.log('更新后的meal UTC日期:', new Date(updatedMeal.consumed_at).toISOString().split('T')[0]);
            console.log('更新后的meal 本地日期:', mealDateLocal);
            console.log('当前选中的日期:', selectedDate);
            
            // 如果日期不同，使用meal的本地日期来加载数据
            if (mealDateLocal && mealDateLocal !== selectedDate) {
                console.log('日期不匹配，使用meal的本地日期加载数据:', mealDateLocal);
                dateToLoad = mealDateLocal;
                // 同时更新选中的日期
                setSelectedDate(mealDateLocal);
            }
        }
        
        // 等待一下确保后端更新完成
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('第一次刷新数据，日期:', dateToLoad);
        
        // 多次尝试刷新，确保数据同步
        let refreshedData = [];
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                refreshedData = await getMeals(dateToLoad);
                console.log(`刷新尝试 ${retryCount + 1} - 数据数量:`, refreshedData.length);
                
                // 检查更新后的meal是否存在
                if (updatedMeal) {
                    const foundMeal = refreshedData.find(m => m.id === updatedMeal.id);
                    if (foundMeal) {
                        console.log('刷新后找到更新的meal:', foundMeal.id);
                        console.log('meal的items数量:', foundMeal.items?.length || 0);
                        if (foundMeal.items && foundMeal.items.length > 0) {
                            console.log('meal的items:', foundMeal.items.map(i => i.food_name));
                        } else {
                            console.warn('警告：meal存在但没有items！');
                            // 如果meal存在但没有items，等待一下再试
                            if (retryCount < maxRetries - 1) {
                                await new Promise(resolve => setTimeout(resolve, 200));
                                retryCount++;
                                continue;
                            }
                        }
                        break; // 找到了，退出循环
                    } else {
                        console.log(`刷新尝试 ${retryCount + 1} - 未找到更新的meal ${updatedMeal.id}`);
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
                console.error(`刷新尝试 ${retryCount + 1} 失败:`, err);
                if (retryCount < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    retryCount++;
                    continue;
                }
                throw err;
            }
        }
        
        console.log('最终刷新后的数据数量:', refreshedData.length);
        setMeals(refreshedData);
    };

    const handleDeleteMeal = async (mealId) => {
        if (window.confirm('确定要删除这个餐食记录吗？')) {
            try {
                await deleteMeal(mealId);
                await loadMeals();
            } catch (err) {
                setError(err.message || '删除失败');
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
            console.error('更新用户目标失败:', err);
        }
    };

    const formatDateShort = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
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
        const title = meal.title || '其他';
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
            return '今天';
        } else if (dateString === yesterday.toISOString().split('T')[0]) {
            return '昨天';
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        }
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
                            设置目标
                        </button>
                        <button onClick={handleLogout} className="btn btn-secondary">
                            登出
                        </button>
                    </nav>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-container">
                    <div className="dashboard-header-section">
                        <h1>我的记录</h1>
                        <div className="date-selector">
                            <label htmlFor="date-select">选择日期：</label>
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
                                <div className="stat-label">卡路里</div>
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
                                <div className="stat-label">蛋白质</div>
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
                                <div className="stat-label">碳水化合物</div>
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
                                <div className="stat-label">脂肪</div>
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
                            + 添加餐食
                        </button>
                    </div>

                    {/* 错误提示 */}
                    {error && <div className="error">{error}</div>}

                    {/* 餐食列表 - 只显示选中日期的，相同类型合并显示 */}
                    {loading ? (
                        <div className="loading">加载中...</div>
                    ) : mergedMeals.length === 0 ? (
                        <div className="empty-state">
                            <p>{formatDateDisplay(selectedDate)}还没有记录任何餐食</p>
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                添加第一条记录
                            </button>
                        </div>
                    ) : (
                        <div className="meals-list">
                            {mergedMeals.map((meal) => (
                                <div key={meal.id} className="meal-card">
                                    <div className="meal-header">
                                        <div className="meal-title-row">
                                            <h3>
                                                {meal.title}
                                                {meal.mealCount > 1 && (
                                                    <span className="meal-count-badge">({meal.mealCount}次)</span>
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
                                                title="编辑"
                                            >
                                                编辑
                                            </button>
                                            <button 
                                                className="btn-delete-meal"
                                                onClick={() => handleDeleteMeal(meal.id)}
                                                title="删除"
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </div>
                                    {meal.notes && (
                                        <p className="meal-notes">{meal.notes}</p>
                                    )}
                                    {/* 显示食物项列表 */}
                                    {meal.items && meal.items.length > 0 && (
                                        <div className="meal-items">
                                            <div className="meal-items-label">食物：</div>
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
                                            蛋白质 <strong>{Math.round(meal.total_protein || 0)}</strong>g
                                        </span>
                                        <span className="meal-stat">
                                            碳水 <strong>{Math.round(meal.total_carbs || 0)}</strong>g
                                        </span>
                                        <span className="meal-stat">
                                            脂肪 <strong>{Math.round(meal.total_fat || 0)}</strong>g
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
