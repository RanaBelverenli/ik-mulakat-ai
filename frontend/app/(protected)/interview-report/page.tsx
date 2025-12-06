"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const feedbackHighlights = [
  {
    title: "Güçlü Yönler",
    items: [
      "Pozitif ve güven veren beden dili kullandı.",
      "Örneklerle desteklenen net ve anlaşılır cevaplar verdi.",
      "Sorulara hızlı adapte olarak teknik bilgi seviyesini gösterdi.",
    ],
  },
  {
    title: "Geliştirilmesi Gerekenler",
    items: [
      "Bazı cevaplarda tekrar eden ifadeler kullanıldı.",
      "Teknik örnekler daha somut metriklerle desteklenebilir.",
      "Kapanışta sorular sorma kısmı atlandı.",
    ],
  },
];

const aiRecommendations = [
  {
    label: "Teknik Derinlik",
    description: "Örnekleri metriklerle zenginleştirerek etki alanını vurgula.",
  },
  {
    label: "İletişim",
    description: "Yanıt öncesi kısa düşünme aralarıyla vurgu noktalarını belirginleştir.",
  },
  {
    label: "Kapanış",
    description: "Son bölümde rol, ekip veya şirket hakkında en az bir soru sor.",
  },
];

export default function InterviewReportPage() {
  const router = useRouter();

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
            <p className="text-lg font-semibold text-gray-900">38 dk 12 sn</p>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Analiz tamamlandı
          </span>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 bg-white">
            <p className="text-sm text-gray-500">Genel AI Skoru</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-purple-600">86</span>
              <span className="text-sm text-gray-500">/100</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Aday, güçlü iletişim ve teknik örneklerle beklentilerin üzerinde performans gösterdi.
            </p>
          </Card>

          <Card className="p-5 bg-white">
            <p className="text-sm text-gray-500">Duygu Analizi</p>
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pozitif</span>
                  <span className="font-semibold text-gray-900">69%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: "69%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Nötr</span>
                  <span className="font-semibold text-gray-900">22%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="h-2 rounded-full bg-gray-400" style={{ width: "22%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Negatif</span>
                  <span className="font-semibold text-gray-900">9%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="h-2 rounded-full bg-red-400" style={{ width: "9%" }} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white">
            <p className="text-sm text-gray-500">Öne Çıkan Konular</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• React ekosistemi ve performans optimizasyonu</li>
              <li>• Takım içi iletişim ve mentorluk deneyimi</li>
              <li>• Ürün teslim süreçlerinde sorumluluk alma</li>
            </ul>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {feedbackHighlights.map((section) => (
            <Card key={section.title} className="p-6 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mt-2"></span>
                    <p>{item}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-white">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Yapay Zekâ Önerileri</p>
            <h2 className="text-xl font-semibold text-gray-900">Sonraki görüşme için aksiyonlar</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {aiRecommendations.map((rec) => (
              <div key={rec.label} className="border border-gray-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">{rec.label}</p>
                <p className="text-sm text-gray-700 mt-2">{rec.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => router.push("/dashboard")} className="bg-purple-600 text-white hover:bg-purple-700">
            Dashboard'a Dön
          </Button>
        </div>
      </main>
    </div>
  );
}

