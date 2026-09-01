import api from './axios';

export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const refresh = () => api.post('/auth/refresh');
export const getMe = () => api.get('/auth/me');
