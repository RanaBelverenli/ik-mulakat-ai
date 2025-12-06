"use client";

import Link from "next/link";

const infoSections = [
  {
    title: "Biz Kimiz?",
    description:
      "AI Mülakat Asistanı, işe alım uzmanları ve deneyimli yazılım geliştiricilerinden oluşan bir ekip tarafından geliştirildi.",
  },
  {
    title: "Misyon",
    description:
      "Kurumların adil, hızlı ve veri odaklı kararlar almasını sağlamak; görüşme sırasında adayın iletişimini analiz ederek anlık içgörüler sunmak.",
  },
  {
    title: "Vizyon",
    description:
      "Yapay zekâ destekli mülakat deneyimini standart hâle getirerek dünya genelinde daha kapsayıcı işe alım süreçleri oluşturmak.",
  },
];

export default function LandingPage() {

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #5A64FF 0%, #A24BFF 45%, #FF57FF 100%)",
      }}
    >
      <header className="w-full px-6 md:px-12 lg:px-16 py-6 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-white">AI Mülakat Asistanı</h1>
        <nav className="flex items-center gap-6 text-sm md:text-base font-medium text-white/90">
          <span className="hover:text-white transition-colors">Biz Kimiz?</span>
          <span className="hover:text-white transition-colors">Misyon</span>
          <span className="hover:text-white transition-colors">Vizyon</span>
        </nav>
      </header>

      <main className="flex-1 flex items-center px-6 md:px-12 lg:px-16 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full max-w-6xl mx-auto">
          <div className="space-y-6 text-white max-w-xl">
            <p className="text-lg uppercase tracking-[0.2em] text-white/80">AI Mülakat Asistanı</p>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Gerçek zamanlı yapay zekâ destekli mülakat analiz sistemi
            </h2>
            <p className="text-lg text-white/90">
              Doğal dil işleme, duygu analizi ve performans skorlamayı tek ekranda birleştirerek insan kaynakları
              ekiplerine güçlü içgörüler sunuyoruz.
            </p>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-[#6A11CB] font-medium rounded-full hover:bg-white/90 transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-3 border border-white text-white font-medium rounded-full hover:bg-white/10 transition-colors"
              >
                Kayıt Ol
              </Link>
            </div>
          </div>

          <div className="w-full">
            <div className="relative rounded-[36px] p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl shadow-purple-500/40">
              <div className="flex items-center gap-3 mb-6 text-white/90 text-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
                  AI
                </span>
                AI Mülakat Asistanı
              </div>
              <div
                className="w-full h-64 rounded-[28px]"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
                  border: "1px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                }}
              />
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

