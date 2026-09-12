import api from './axios';

export const getMyProfile = () => api.get('/auth/me');

export const updateProfile = (data) => api.patch('/auth/me', data);

export const updatePartner = (data) => api.patch('/auth/partner', data);

export const changePassword = (data) => api.post('/auth/change-password', data);

export const completeOnboarding = (data) => api.post('/auth/onboarding', data);

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  // Content-Type must be undefined (not 'multipart/form-data') so that:
  //   1. The axios instance-level 'application/json' default is cleared.
  //   2. Axios auto-sets 'multipart/form-data; boundary=...' from the FormData.
  //      (Setting it manually omits the boundary, breaking multer parsing.)
  //   3. The X-CSRF-Token added by the request interceptor is still merged in.
  return api.post('/auth/me/avatar', formData, {
    headers: { 'Content-Type': undefined },
  });
};
