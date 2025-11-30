const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// 从 localStorage 获取 token
const getToken = () => {
    return localStorage.getItem('authToken');
};

// 保存 token 到 localStorage
export const setToken = (token) => {
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

// 设置请求选项，包含 JWT token
const fetchOptions = (method, body) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // 如果有 token，添加到请求头
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('请求包含 token:', token.substring(0, 20) + '...');
    } else {
        console.warn('请求没有 token');
    }
    
    return {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) }),
    };
};

// 处理响应
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '请求失败' }));
        throw new Error(error.error || '请求失败');
    }
    return response.json();
};

// 带重试的 fetch 请求
const fetchWithRetry = async (url, options, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
        try {
            // 创建超时控制器
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            // 如果是最后一次重试，抛出错误
            if (i === retries) {
                // 检查是否是网络错误或超时
                if (error.name === 'AbortError') {
                    throw new Error('请求超时。如果使用 Render 免费服务，首次访问可能需要等待约30秒唤醒服务，请稍后重试。');
                }
                if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
                    throw new Error('网络连接失败，请检查网络连接或稍后重试。如果使用 Render 免费服务，首次访问可能需要等待约30秒唤醒服务。');
                }
                throw error;
            }
            // 等待后重试（指数退避）
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
};

// 登录
export const login = async (email, password) => {
    const url = `${API_BASE_URL}/users/login`;
    const options = fetchOptions('POST', { firstname: email, password });
    
    const response = await fetch(url, options);
    const result = await handleResponse(response);
    
    // 保存 token 到 localStorage
    if (result.token) {
        setToken(result.token);
        console.log('Token 已保存到 localStorage:', result.token.substring(0, 20) + '...');
        console.log('验证 token 是否保存:', getToken() ? '是' : '否');
    } else {
        console.error('登录响应中没有 token:', result);
    }
    
    return result;
};

// 注册
export const register = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        ...fetchOptions('POST', { firstname: email, password }),
    });
    return handleResponse(response);
};

// 登出
export const logout = async () => {
    // 清除 token
    setToken(null);
    console.log('Token 已清除');
    return { message: '登出成功' };
};

// 获取餐食列表
export const getMeals = async (date) => {
    const url = date 
        ? `${API_BASE_URL}/meals?date=${date}`
        : `${API_BASE_URL}/meals`;
    const response = await fetchWithRetry(url, fetchOptions('GET'));
    return handleResponse(response);
};

// 获取单个餐食详情
export const getMeal = async (mealId) => {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
        ...fetchOptions('GET'),
    });
    return handleResponse(response);
};

// 创建餐食
export const createMeal = async (mealData) => {
    const response = await fetch(`${API_BASE_URL}/meals`, {
        ...fetchOptions('POST', mealData),
    });
    return handleResponse(response);
};

// 更新餐食
export const updateMeal = async (mealId, mealData) => {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
        ...fetchOptions('PUT', mealData),
    });
    return handleResponse(response);
};

// 删除餐食
export const deleteMeal = async (mealId) => {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
        ...fetchOptions('DELETE'),
    });
    return handleResponse(response);
};

// 删除食物项
export const deleteMealItem = async (mealId, itemId) => {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}/items/${itemId}`, {
        ...fetchOptions('DELETE'),
    });
    return handleResponse(response);
};

// 更新食物项
export const updateMealItem = async (mealId, itemId, itemData) => {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}/items/${itemId}`, {
        ...fetchOptions('PUT', itemData),
    });
    return handleResponse(response);
};

// 获取当前用户信息
export const getCurrentUser = async () => {
    const response = await fetchWithRetry(`${API_BASE_URL}/users/me`, fetchOptions('GET'));
    return handleResponse(response);
};

// 更新用户目标
export const updateUserGoals = async (goals) => {
    const response = await fetch(`${API_BASE_URL}/users/me/goals`, {
        ...fetchOptions('PUT', goals),
    });
    return handleResponse(response);
};

