"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

interface InterviewSession {
  id: string;
  candidate_name: string;
  interview_date: string;
  score_10: number;
  status_label: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [recentSessions, setRecentSessions] = useState<InterviewSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Supabase'den son seansları çek - TÜM HOOK'LAR ERKEN RETURN'DEN ÖNCE OLMALI
  useEffect(() => {
    const fetchRecentSessions = async () => {
      try {
        setSessionsLoading(true);
        const { data, error } = await supabase
          .from("interview_sessions")
          .select("id, candidate_name, interview_date, score_10, status_label")
          .order("interview_date", { ascending: false })
          .limit(10);

        if (error) {
          console.error("[Dashboard] Supabase hatası:", error);
          return;
        }

        if (data) {
          setRecentSessions(data);
        }
      } catch (err) {
        console.error("[Dashboard] Hata:", err);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchRecentSessions();
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (statusLabel: string): { bg: string; text: string } => {
    if (statusLabel === "Güçlü Aday") {
      return { bg: "bg-green-100", text: "text-green-800" };
    } else if (statusLabel === "İkinci Görüşme") {
      return { bg: "bg-yellow-100", text: "text-yellow-800" };
    } else {
      return { bg: "bg-red-100", text: "text-red-800" };
    }
  };

  // Early return - TÜM HOOK'LARDAN SONRA
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  // Mock data - gerçek veriler API'den gelecek
  const metrics = [
    {
      title: "Toplam Mülakat",
      value: "142",
      change: "+12%",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Ortalama Aday Skoru",
      value: "7.8",
      change: "+0.3",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      title: "Pozitif Duygu Oranı",
      value: "68%",
      change: "+5%",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: "Tamamlanan Raporlar",
      value: "134",
      change: "+18",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  // Graph data points
  const graphData = [12, 18, 15, 25, 22, 8, 5];
  const maxValue = Math.max(...graphData);
  const graphHeight = 200;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-purple-600">AI Mülakat</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 flex flex-col">
          <div className="space-y-2 flex-1 overflow-y-auto">
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-50 text-purple-600 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Panel
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Mülakatlar
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Adaylar
            </a>
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ayarlar
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full border-t border-gray-200 pt-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Çıkış Yap
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Yönetim Paneli</h1>
              <p className="text-gray-600">Tekrar hoş geldiniz! İşte mülakat analizleriniz.</p>
            </div>
            <Button
              onClick={() => router.push("/interview-admin")}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Yeni Mülakat Başlat
            </Button>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <Card key={index} className="p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    {metric.icon}
                  </div>
                  <span className="text-sm font-medium text-green-600">{metric.change}</span>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">{metric.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </Card>
            ))}
          </div>

          {/* Weekly Interview Activity Graph */}
          <Card className="p-6 bg-white mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Haftalık Mülakat Aktivitesi</h2>
              <p className="text-sm text-gray-600">Son 7 gün</p>
            </div>
            <div className="relative" style={{ height: `${graphHeight}px` }}>
              <svg width="100%" height={graphHeight} className="overflow-visible">
                {/* Grid lines */}
                {[0, 7, 14, 21, 28].map((value) => (
                  <line
                    key={value}
                    x1="0"
                    y1={graphHeight - (value / maxValue) * graphHeight}
                    x2="100%"
                    y2={graphHeight - (value / maxValue) * graphHeight}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                ))}
                {/* Graph line */}
                <polyline
                  points={graphData
                    .map(
                      (value, index) =>
                        `${(index / (graphData.length - 1)) * 100}%,${graphHeight - (value / maxValue) * graphHeight}`
                    )
                    .join(" ")}
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                {graphData.map((value, index) => (
                  <circle
                    key={index}
                    cx={`${(index / (graphData.length - 1)) * 100}%`}
                    cy={graphHeight - (value / maxValue) * graphHeight}
                    r="6"
                    fill="#9333ea"
                  />
                ))}
              </svg>
              {/* X-axis labels */}
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 flex flex-col justify-between h-full text-xs text-gray-600">
                {[28, 21, 14, 7, 0].map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
            </div>
          </Card>

          {/* Recent Sessions */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Son Seanslar</h2>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Henüz mülakat seansı yok.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSessions.map((session) => {
                  const statusColors = getStatusColor(session.status_label);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/interview-report?session_id=${session.id}`)}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{session.candidate_name}</h3>
                        <p className="text-sm text-gray-600">{formatDate(session.interview_date)}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{session.score_10.toFixed(1)}/10</p>
                          <p className="text-xs text-gray-600">Puan</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
                          {session.status_label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
