import api from './axios';

export const getTracks = async () => {
  const response = await api.get('/radyo');
  return response.data.data;
};

export const uploadTrack = async (file) => {
  const formData = new FormData();
  formData.append('audio', file);

  const response = await api.post('/radyo/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const deleteTrack = async (id) => {
  const response = await api.delete(`/radyo/${id}`);
  return response.data.data;
};
