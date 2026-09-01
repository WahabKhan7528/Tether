import api from './axios';

export const getMemories = (params) => api.get('/memories', { params });
export const getMemory = (id) => api.get(`/memories/${id}`);
export const createMemory = (data) => api.post('/memories', data);
export const updateMemory = (id, data) => api.patch(`/memories/${id}`, data);
export const deleteMemory = (id) => api.delete(`/memories/${id}`);

