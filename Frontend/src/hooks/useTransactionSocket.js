import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_ORIGIN } from '../services/api';

/**
 * Live updates from the server.
 *
 * handlers: { onNew(tx), onUpdated(tx), onDeleted({ id }), onConnect() }
 * Returns { connected }.
 *
 * onConnect fires on every (re)connect, so the page can reload once and pick up
 * anything it missed while the socket was down.
 */
export default function useTransactionSocket(token, handlers) {
  const [connected, setConnected] = useState(false);

  // Always call the latest handlers without reconnecting the socket on each render
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(API_ORIGIN, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      handlersRef.current?.onConnect?.();
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('transaction:new', (tx) => handlersRef.current?.onNew?.(tx));
    socket.on('transaction:updated', (tx) => handlersRef.current?.onUpdated?.(tx));
    socket.on('transaction:deleted', (payload) => handlersRef.current?.onDeleted?.(payload));

    return () => {
      socket.removeAllListeners();
      socket.close();
      setConnected(false);
    };
  }, [token]);

  return { connected };
}