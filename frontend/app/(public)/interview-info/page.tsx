"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

const interviewFlow = [
  {
    title: "Hazırlık",
    description: "Kameranızı ve mikrofonunuzu test edin, stabil bir internet bağlantısı sağlayın.",
  },
  {
    title: "Isınma Soruları",
    description: "Önce kısa tanıma soruları gelir. Akıcı ve net cevaplar vermeniz önerilir.",
  },
  {
    title: "Teknik Bölüm",
    description: "Rolünüze uygun örnek senaryolar ve problem çözme soruları ile ilerler.",
  },
  {
    title: "Kapanış",
    description: "Son değerlendirme ve sonraki adımlar hakkında bilgi paylaşılır.",
  },
];

const tips = [
  "Arka planınızı sade tutun ve iyi aydınlatılmış bir ortamda olun.",
  "Soruları yanıtlarken önce düşüncelerinizi kısaca organize edin.",
  "Mimik ve beden dilinizi doğal tutarak kameraya bakmaya çalışın.",
  "Sürenizi verimli kullanın; gerektiğinde kısa notlar alabilirsiniz.",
];

export default function InterviewInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-700">Yükleniyor...</div>
      </div>
    );
  }

  if (!session) {
    router.replace("/login");
    return null;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto py-12 px-6 lg:px-0">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-[0.2em] text-purple-500 font-semibold">Mülakat Bilgilendirmesi</p>
            <h1 className="text-4xl font-bold text-gray-900 mt-3">Görüşmeye Başlamadan Önce</h1>
            <p className="text-lg text-gray-600 mt-4 max-w-3xl">
              Aşağıdaki adımlar mülakat sürecinde nelerle karşılaşacağınızı anlatır. Hazır olduğunuzda
              "Mülakatı Başlat" butonuna tıklayarak görüntülü görüşmeyi başlatabilirsiniz.
            </p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            Çıkış Yap
          </Button>
        </div>

        <div className="grid gap-8">
          <Card className="p-8 shadow-xl bg-white/90 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Mülakat Akışı</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {interviewFlow.map((step, index) => (
                <div key={step.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hızlı İpuçları</h2>
              <ul className="space-y-3 text-gray-700">
                {tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-purple-500"></span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-purple-50 p-6">
              <div>
                <p className="text-sm uppercase tracking-wider text-purple-600 font-semibold">Hazır mısınız?</p>
                <p className="text-lg text-gray-700 mt-1">
                  Mülakat esnasında kameranızı ve mikrofonunuzu etkinleştirmeniz gerekecek.
                </p>
              </div>
              <Button
                onClick={() => router.push("/interview")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-base font-medium"
              >
                Mülakatı Başlat
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

