"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Backend URL
const getBackendUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ik-mulakat-ai.onrender.com';
  return apiUrl.replace(/\/$/, '');
};

// Types
interface Sentiment {
  positive: number;
  neutral: number;
  negative: number;
}

interface InterviewReport {
  overall_score: number;
  overall_comment: string;
  sentiment: Sentiment;
  key_topics: string[];
  strengths: string[];
  improvements: string[];
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} dk ${secs} sn`;
};

export default function InterviewReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Duration'ı localStorage'dan al
    const savedDuration = localStorage.getItem("interview_duration");
    if (savedDuration) {
      setDuration(parseInt(savedDuration, 10));
    }

    // Transcript'i localStorage'dan al
    const transcript = localStorage.getItem("interview_transcript");
    
    if (!transcript || transcript.trim().length < 20) {
      setError("Transkript bulunamadı veya çok kısa. Lütfen mülakatı tamamlayın.");
      setLoading(false);
      return;
    }

    // API çağrısı yap
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/v1/ai/report`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript: transcript,
            language: "tr",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setReport(data);
        console.log("[Interview Report] Rapor alındı:", data);
      } catch (err) {
        console.error("[Interview Report] Hata:", err);
        setError("Rapor oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-sm text-gray-500">Mülakat Raporu</p>
            <h1 className="text-2xl font-semibold text-gray-900">AI Görüşme Geri Bildirimi</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-500">Görüşme Süresi</p>
            <p className="text-lg font-semibold text-gray-900">{formatDuration(duration)}</p>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            loading 
              ? "bg-yellow-100 text-yellow-700" 
              : error 
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              loading 
                ? "bg-yellow-500" 
                : error 
                ? "bg-red-500"
                : "bg-green-500"
            }`}></span>
            {loading ? "Analiz hazırlanıyor..." : error ? "Hata oluştu" : "Analiz tamamlandı"}
          </span>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">AI analizi hazırlanıyor...</p>
          </div>
        )}

        {error && (
          <Card className="p-6 bg-red-50 border border-red-200">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => router.push("/interview-admin")}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white"
            >
              Mülakat Sayfasına Dön
            </Button>
          </Card>
        )}

        {!loading && !error && report && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-5 bg-white">
                <p className="text-sm text-gray-500">Genel AI Skoru</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-purple-600">{report.overall_score}</span>
                  <span className="text-sm text-gray-500">/100</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {report.overall_comment || "Değerlendirme yapılamadı."}
                </p>
              </Card>

              <Card className="p-5 bg-white">
                <p className="text-sm text-gray-500">Duygu Analizi</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Pozitif</span>
                      <span className="font-semibold text-gray-900">{report.sentiment.positive}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: `${report.sentiment.positive}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Nötr</span>
                      <span className="font-semibold text-gray-900">{report.sentiment.neutral}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div className="h-2 rounded-full bg-gray-400" style={{ width: `${report.sentiment.neutral}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Negatif</span>
                      <span className="font-semibold text-gray-900">{report.sentiment.negative}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div className="h-2 rounded-full bg-red-400" style={{ width: `${report.sentiment.negative}%` }} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-white">
                <p className="text-sm text-gray-500">Öne Çıkan Konular</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {report.key_topics.length > 0 ? (
                    report.key_topics.map((topic, idx) => (
                      <li key={idx}>• {topic}</li>
                    ))
                  ) : (
                    <li className="text-gray-400">Henüz konu belirlenmedi</li>
                  )}
                </ul>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Güçlü Yönler</h2>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  {report.strengths.length > 0 ? (
                    report.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-green-500 mt-2"></span>
                        <p>{strength}</p>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">Henüz belirlenmedi</li>
                  )}
                </ul>
              </Card>

              <Card className="p-6 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Geliştirilmesi Gerekenler</h2>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  {report.improvements.length > 0 ? (
                    report.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-orange-500 mt-2"></span>
                        <p>{improvement}</p>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">Henüz belirlenmedi</li>
                  )}
                </ul>
              </Card>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button onClick={() => router.push("/dashboard")} className="bg-purple-600 text-white hover:bg-purple-700">
            Dashboard'a Dön
          </Button>
        </div>
      </main>
    </div>
  );
}

