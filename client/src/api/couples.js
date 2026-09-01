import api from './axios';

export const joinCouple = (data) => api.post('/couples/join', data);
export const getMyCouple = () => api.get('/couples/me');
export const updateCouple = (data) => api.patch('/couples/me', data);

export const addMilestone = (data) => api.post('/couples/me/milestones', data);
export const deleteMilestone = (itemId) => api.delete(`/couples/me/milestones/${itemId}`);

export const addBucketListItem = (data) => api.post('/couples/me/bucket-list', data);
export const toggleBucketListItem = (itemId) => api.patch(`/couples/me/bucket-list/${itemId}`);
export const deleteBucketListItem = (itemId) => api.delete(`/couples/me/bucket-list/${itemId}`);
