const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// 设置请求选项，包含凭据以支持 session
const fetchOptions = (method, body) => ({
    method,
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include', // 重要：包含 cookies/session
    ...(body && { body: JSON.stringify(body) }),
});

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
    const response = await fetch(`${API_BASE_URL}/users/login`, {
        ...fetchOptions('POST', { firstname: email, password }),
    });
    return handleResponse(response);
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

