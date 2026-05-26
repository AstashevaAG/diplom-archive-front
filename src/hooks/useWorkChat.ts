import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { WorkMessage } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL).replace('/api', '')
  : 'http://localhost:3000';

export function useWorkChat(workId: string) {
  const [messages, setMessages] = useState<WorkMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !workId) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('joinWork', workId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('newMessage', (msg: WorkMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.emit('leaveWork', workId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [workId]);

  const sendMessage = useCallback((text: string, fileId?: string) => {
    if (!socketRef.current?.connected || !text.trim()) return;
    socketRef.current.emit('sendMessage', { workId, text: text.trim(), fileId });
  }, [workId]);

  return { messages, setMessages, connected, sendMessage };
}
