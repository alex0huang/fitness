const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// 调试：打印 API URL
console.log('API_BASE_URL:', API_BASE_URL);
console.log('VITE_API_BASE_URL env:', import.meta.env.VITE_API_BASE_URL);

// 设置请求选项，包含凭据以支持 session
const fetchOptions = (method, body) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // 重要：包含 cookies/session
        ...(body && { body: JSON.stringify(body) }),
    };
    console.log('请求选项:', { method, url: `${API_BASE_URL}`, credentials: options.credentials });
    return options;
};

// 处理响应
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '请求失败' }));
        throw new Error(error.error || '请求失败');
    }
    return response.json();
};

// 登录
export const login = async (email, password) => {
    const url = `${API_BASE_URL}/users/login`;
    console.log('登录请求 URL:', url);
    const options = fetchOptions('POST', { firstname: email, password });
    console.log('登录请求选项:', options);
    
    const response = await fetch(url, options);
    console.log('登录响应状态:', response.status);
    console.log('登录响应头:', Object.fromEntries(response.headers.entries()));
    
    const result = await handleResponse(response);
    console.log('登录响应数据:', result);
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
    const response = await fetch(`${API_BASE_URL}/users/logout`, {
        ...fetchOptions('POST'),
    });
    return handleResponse(response);
};

// 获取餐食列表
export const getMeals = async (date) => {
    const url = date 
        ? `${API_BASE_URL}/meals?date=${date}`
        : `${API_BASE_URL}/meals`;
    const response = await fetch(url, {
        ...fetchOptions('GET'),
    });
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
    const response = await fetch(`${API_BASE_URL}/users/me`, {
        ...fetchOptions('GET'),
    });
    return handleResponse(response);
};

// 更新用户目标
export const updateUserGoals = async (goals) => {
    const response = await fetch(`${API_BASE_URL}/users/me/goals`, {
        ...fetchOptions('PUT', goals),
    });
    return handleResponse(response);
};

