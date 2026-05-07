import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { NotificationPayload } from '../types/forum';

const GATEWAY = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
const WS_URL = `${GATEWAY}/forum/ws`;

type TopicCallback = (payload: NotificationPayload) => void;

export function useWebSocket() {
  const clientRef = useRef<Client | null>(null);
  const subscriptions = useRef<Map<string, TopicCallback>>(new Map());

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        subscriptions.current.forEach((cb, topic) => {
          client.subscribe(topic, msg => {
            try { cb(JSON.parse(msg.body)); } catch {}
          });
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, []);

  const subscribe = useCallback((topic: string, callback: TopicCallback) => {
    subscriptions.current.set(topic, callback);
    if (clientRef.current?.connected) {
      clientRef.current.subscribe(topic, msg => {
        try { callback(JSON.parse(msg.body)); } catch {}
      });
    }
  }, []);

  const unsubscribe = useCallback((topic: string) => {
    subscriptions.current.delete(topic);
  }, []);

  return { subscribe, unsubscribe };
}
