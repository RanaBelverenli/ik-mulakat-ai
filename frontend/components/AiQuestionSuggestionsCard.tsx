"use client";

/**
 * AI Soru Önerileri Kartı (Gemini)
 * Adayın transkriptine göre takip soruları üretir
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TranscriptItem } from "./LiveTranscriptPanel";

// Backend URL
const getBackendUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ik-mulakat-ai.onrender.com';
  return apiUrl.replace(/\/$/, '');
};

interface AiQuestionSuggestionsCardProps {
  sessionId: string;
  transcriptItems: TranscriptItem[]; // LiveTranscriptPanel'den gelen transcript items
}

export function AiQuestionSuggestionsCard({
  sessionId,
  transcriptItems,
}: AiQuestionSuggestionsCardProps) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Aday mesajlarını birleştir
  const getCandidateTranscript = (): string => {
    const candidateMessages = transcriptItems
      .filter((item) => item.role === "Aday")
      .map((item) => item.text)
      .join("\n");
    
    return candidateMessages;
  };

  const transcriptText = getCandidateTranscript();
  const hasEnoughTranscript = transcriptText.length >= 50; // Minimum 50 karakter

  const handleGenerateQuestions = async () => {
    if (!hasEnoughTranscript) {
      setError("Transkript çok kısa. Lütfen adayın birkaç cümle konuşmasını bekleyin.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/ai/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: transcriptText,
          language: "tr",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setQuestions(data.questions || []);
      setLastUpdated(new Date());
      console.log("[AI Questions] Soru önerileri alındı:", data.questions);
    } catch (err) {
      console.error("[AI Questions] Hata:", err);
      setError("Soru önerileri alınırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

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
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900">Soru Önerileri (Gemini)</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Adayın verdiği cevaplara göre önerilen takip soruları.
      </p>

      {/* Hata mesajı */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Soru önerileri hazırlanıyor...</p>
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* Empty state - transcript yok */}
      {!hasEnoughTranscript && !isLoading && questions.length === 0 && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
          Henüz soru önerisi yok. Aday birkaç cümle konuştuktan sonra aşağıdaki butona tıklayın.
        </div>
      )}

      {/* Sorular listesi */}
      {questions.length > 0 && !isLoading && (
        <div className="mb-4">
          {lastUpdated && (
            <p className="text-xs text-gray-500 mb-3">
              Son güncelleme: {formatTime(lastUpdated)}
            </p>
          )}
          <ol className="space-y-2 list-decimal pl-6">
            {questions.map((question, idx) => (
              <li key={idx} className="text-sm text-slate-800 leading-relaxed">
                {question}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Buton */}
      <Button
        onClick={handleGenerateQuestions}
        disabled={isLoading || !hasEnoughTranscript}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isLoading ? "Hazırlanıyor..." : "Soru Önerisi Oluştur"}
      </Button>
    </Card>
  );
}

