"use client";

/**
 * Canlı Transkript Paneli
 * WebSocket üzerinden gelen transcript mesajlarını gerçek zamanlı gösterir
 */

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";

// Backend URL
const getBackendUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ik-mulakat-ai.onrender.com';
  return apiUrl.replace(/^http/, 'ws').replace(/\/$/, '');
};

export interface TranscriptItem {
  id: string;
  role: "Aday" | "Görüşmeci";
  text: string;
  timestamp: Date;
}

interface LiveTranscriptPanelProps {
  sessionId: string;
}

export function LiveTranscriptPanel({ sessionId }: LiveTranscriptPanelProps) {
  const [items, setItems] = useState<TranscriptItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket bağlantısı
  useEffect(() => {
    if (!sessionId) return;

    const backendUrl = getBackendUrl();
    const wsUrl = `${backendUrl}/api/v1/stt/ws/transcript?session_id=${sessionId}`;

    console.log('[Transcript] WebSocket bağlantısı kuruluyor:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Transcript] ✅ WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
    };

    ws.onclose = (event) => {
      console.log('[Transcript] WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('[Transcript] ❌ WebSocket error:', error);
      setConnectionError('Transkript bağlantısı kurulamadı');
    };

    ws.onmessage = (event) => {
      try {
        // Ping/pong mesajları
        if (event.data === 'ping') {
          ws.send('pong');
          return;
        }
        if (event.data === 'pong') {
          return;
        }

        const data = JSON.parse(event.data) as { role: string; text: string };
        
        console.log('[Transcript] Mesaj alındı:', data);

        const newItem: TranscriptItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: data.role === "Aday" ? "Aday" : "Görüşmeci",
          text: data.text,
          timestamp: new Date(),
        };

        setItems((prev) => [...prev, newItem]);
      } catch (error) {
        console.error('[Transcript] Mesaj parse hatası:', error, event.data);
      }
    };

    // Cleanup
    return () => {
      console.log('[Transcript] Cleanup - WebSocket kapatılıyor');
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmount');
      }
      wsRef.current = null;
    };
  }, [sessionId]);

  // Yeni mesaj geldiğinde otomatik scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900">Canlı Transkript</h2>
        
        {/* Bağlantı durumu göstergesi */}
        <div className="ml-auto flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-gray-500">
            {isConnected ? "Bağlı" : "Bağlantı Yok"}
          </span>
        </div>
      </div>

      {/* Hata mesajı */}
      {connectionError && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {connectionError}
        </div>
      )}

      {/* Transcript listesi */}
      <div
        ref={scrollRef}
        className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
      >
        {items.map((item) => (
          <div key={item.id} className="text-sm animate-fadeIn">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`font-medium ${
                  item.role === "Aday" ? "text-blue-600" : "text-purple-600"
                }`}
              >
                {item.role}
              </span>
              <span className="text-gray-400 text-xs">
                ({formatTime(item.timestamp)})
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{item.text}</p>
          </div>
        ))}

        {/* Boş state */}
        {items.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              Henüz transkript yok…
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Konuşma başladığında burada görünecek
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default LiveTranscriptPanel;

