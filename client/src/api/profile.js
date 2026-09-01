import api from './axios';

export const getMyProfile = () => api.get('/auth/me');

export const updateProfile = (data) => api.patch('/auth/me', data);

export const updatePartner = (data) => api.patch('/auth/partner', data);

export const changePassword = (data) => api.post('/auth/change-password', data);

export const completeOnboarding = (data) => api.post('/auth/onboarding', data);

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post('/auth/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
