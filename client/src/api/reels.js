import api from './axios';

export const getReels = (params) => api.get('/reels', { params });
export const createReel = (data) => api.post('/reels', data);
export const updateReel = (id, data) => api.patch(`/reels/${id}`, data);
export const deleteReel = (id) => api.delete(`/reels/${id}`);
