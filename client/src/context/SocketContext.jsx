import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { Home } from 'lucide-react';
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

    // Vercel is a serverless/edge platform — it CANNOT proxy WebSocket connections.
    // The /socket.io/* rewrite in vercel.json only works for regular HTTP requests;
    // WebSocket upgrade requests are silently dropped by Vercel's infrastructure.
    //
    // Fix: In production, the REST API calls go through the Vercel proxy (/api/v1/*)
    // but Socket.IO must connect DIRECTLY to the Render backend origin.
    const RENDER_ORIGIN = 'https://tether-l3e0.onrender.com';
    const isProd = import.meta.env.PROD;
    const apiBase = isProd
      ? '/api/v1'
      : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1');

    // Socket.IO: always connect directly to Render in production (bypasses Vercel).
    // In development connect directly to localhost.
    const serverOrigin = isProd
      ? RENDER_ORIGIN
      : new URL(apiBase).origin; // e.g. http://localhost:5000

    let socketInstance;

    // Fetch the access token from the server so we can pass it in the Socket.IO
    // handshake auth object. This avoids the SameSite=lax cross-origin cookie
    // restriction that silently drops the cookie on WebSocket upgrade requests.
    fetch(`${apiBase}/auth/socket-token`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`socket-token endpoint returned ${res.status}. Check VITE_API_URL includes /api/v1`);
        }
        return res.json();
      })
      .then(({ data }) => {
        if (!data?.token) throw new Error('socket-token response missing token field');

        socketInstance = io(serverOrigin, {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          auth: { token: data.token },
        });

        registerListeners(socketInstance);
        setSocket(socketInstance);
      })
      .catch((err) => {
        console.error('[Socket] Failed to fetch socket token:', err.message);
      });

    function registerListeners(s) {
      s.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
      });

      // ─── Virtual Hugs ───────────────────────────────────────────────────────
      s.on('receive_hug', (data) => {
        if (data.senderId !== user?._id) {
          toast(data.senderName + ' sent you a hug!', {
            style: {
              borderRadius: '20px',
              background: '#FFF5F5',
              color: '#E53E3E',
              fontWeight: 'bold',
            },
          });
        }
        queryClient.invalidateQueries({ queryKey: ['couple'] });
        if (refreshUser) refreshUser();
      });

      // ─── I'm Home notification ───────────────────────────────────────────────
      s.on('partner_is_home', (data) => {
        if (String(data.senderId) !== String(user?._id)) {
          toast.custom(
            (t) => (
              <div
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border border-ethereal-primary/30 bg-ethereal-surface backdrop-blur-md transition-all duration-300 ${t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
              >
                <div className="w-10 h-10 rounded-full bg-ethereal-primary/15 flex items-center justify-center text-ethereal-primary shrink-0">
                  <Home size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ethereal-tertiary tracking-wide">
                    {data.senderName} is home
                  </p>
                  <p className="text-xs text-ethereal-tertiary/50 mt-0.5">
                    Your partner just arrived home
                  </p>
                </div>
              </div>
            ),
            { duration: 5000 }
          );
        }
      });

      // ─── Content / Feed updates ─────────────────────────────────────────────
      s.on('content_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['memories'] });
        queryClient.invalidateQueries({ queryKey: ['gallery'] });
        if (refreshUser) refreshUser();
      });

      // ─── Partner pairing ────────────────────────────────────────────────────
      s.on('partner_joined', () => {
        if (refreshUser) refreshUser();
      });
    }

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, [user?._id, queryClient, refreshUser, coupleIdStr]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
