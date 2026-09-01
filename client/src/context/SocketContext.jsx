import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState(null);

  const coupleIdStr = typeof user?.coupleId === 'object' ? user.coupleId._id : user?.coupleId;

  useEffect(() => {
    // Only connect if user is paired
    if (!coupleIdStr) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketInstance.on('receive_hug', (data) => {
      if (data.senderId !== user?._id) {
        toast(`${data.senderName} sent you a hug!`, {
          style: {
            borderRadius: '20px',
            background: '#FFF5F5',
            color: '#E53E3E',
            fontWeight: 'bold'
          }
        });
      }
      queryClient.invalidateQueries();
      if (refreshUser) refreshUser();
    });

    socketInstance.on('content_updated', () => {
      queryClient.invalidateQueries();
      if (refreshUser) refreshUser();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [coupleIdStr, queryClient, refreshUser]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
