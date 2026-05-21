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
  const activeSubsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        subscriptions.current.forEach((cb, topic) => {
          if (!activeSubsRef.current.has(topic)) {
            const sub = client.subscribe(topic, msg => {
              try { cb(JSON.parse(msg.body)); } catch {}
            });
            activeSubsRef.current.set(topic, sub);
          }
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      activeSubsRef.current.forEach(sub => {
        try { sub.unsubscribe(); } catch {}
      });
      activeSubsRef.current.clear();
      client.deactivate();
    };
  }, []);

  const subscribe = useCallback((topic: string, callback: TopicCallback) => {
    subscriptions.current.set(topic, callback);
    if (clientRef.current?.connected) {
      if (activeSubsRef.current.has(topic)) {
        try { activeSubsRef.current.get(topic).unsubscribe(); } catch {}
        activeSubsRef.current.delete(topic);
      }
      const sub = clientRef.current.subscribe(topic, msg => {
        try { callback(JSON.parse(msg.body)); } catch {}
      });
      activeSubsRef.current.set(topic, sub);
    }
  }, []);

  const unsubscribe = useCallback((topic: string) => {
    subscriptions.current.delete(topic);
    if (activeSubsRef.current.has(topic)) {
      try { activeSubsRef.current.get(topic).unsubscribe(); } catch {}
      activeSubsRef.current.delete(topic);
    }
  }, []);

  return { subscribe, unsubscribe };
}
