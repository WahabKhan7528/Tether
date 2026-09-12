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

    if (!user) {
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
      queryClient.invalidateQueries({ queryKey: ['couple'] });
      if (refreshUser) refreshUser();
    });

    socketInstance.on('content_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      if (refreshUser) refreshUser();
    });

    socketInstance.on('partner_joined', () => {
      if (refreshUser) refreshUser();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?._id, queryClient, refreshUser, coupleIdStr]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
