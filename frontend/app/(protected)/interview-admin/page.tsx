"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWebRTC } from "@/webrtc/useWebRTC";

export default function InterviewAdminPage() {
  const router = useRouter();
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [duration, setDuration] = useState(0); // seconds
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // WebRTC bağlantısı
  const { remoteStream, isConnected, connectionError } = useWebRTC({
    localStream,
    onRemoteStream: (stream) => {
      if (mainVideoRef.current) {
        mainVideoRef.current.srcObject = stream;
      }
    },
  });

  useEffect(() => {
    if (isInterviewStarted) {
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isInterviewStarted]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleInterviewAction = () => {
    if (!isInterviewStarted) {
      setIsInterviewStarted(true);
      setDuration(0);
      return;
    }

    router.push("/interview-report");
  };

  // Initialize camera and microphone stream only once on mount
  useEffect(() => {
    let stream: MediaStream | null = null;

    const enableCamera = async () => {
      try {
        setVideoError(null);
        setAudioError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });
        // Set initial microphone state
        stream.getAudioTracks().forEach((track) => {
          track.enabled = isMicOn;
        });
        // Set initial video state
        stream.getVideoTracks().forEach((track) => {
          track.enabled = isVideoOn;
        });
        setLocalStream(stream);
        setIsMicOn(true);
        setIsVideoOn(true);
      } catch (err) {
        console.error("Camera or audio error:", err);
        setAudioError("Mikrofon erişimi sağlanamadı. Yalnızca kamera açıldı.");
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          stream.getVideoTracks().forEach((track) => {
            track.enabled = isVideoOn;
          });
          setLocalStream(stream);
          setIsMicOn(false);
          setIsVideoOn(true);
        } catch (videoErr) {
          console.error("Camera error:", videoErr);
          setVideoError("Kameraya erişilemiyor. Lütfen izinleri kontrol edin.");
          setIsVideoOn(false);
        }
      }
    };

    // Initialize stream only once when component mounts
    enableCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Handle video on/off by enabling/disabling video tracks
  useEffect(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = isVideoOn;
      });
    }
  }, [isVideoOn, localStream]);

  // Update preview video element (local stream)
  useEffect(() => {
    if (previewVideoRef.current) {
      if (localStream && isVideoOn) {
        previewVideoRef.current.srcObject = localStream;
        const playPromise = previewVideoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Video autoplay prevented:", err);
          });
        }
      } else {
        previewVideoRef.current.pause();
        previewVideoRef.current.srcObject = null;
      }
    }
  }, [localStream, isVideoOn]);

  // Update main video element (remote stream)
  useEffect(() => {
    if (mainVideoRef.current && remoteStream) {
      console.log("🎥 Admin: Remote stream video element'e set ediliyor", remoteStream);
      console.log("🎥 Remote stream tracks:", remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, id: t.id })));
      mainVideoRef.current.srcObject = remoteStream;
      const playPromise = mainVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log("✅ Remote video oynatılıyor"))
          .catch((err) => {
            console.error("❌ Remote video autoplay prevented:", err);
          });
      }
    } else if (mainVideoRef.current && !remoteStream) {
      console.log("⚠️ Admin: Remote stream yok, video temizleniyor");
      mainVideoRef.current.srcObject = null;
    }
  }, [remoteStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      setIsMicOn(false);
    };
  }, [localStream]);

  const handleToggleMic = () => {
    if (!localStream) {
      setAudioError("Önce kamerayı açmalısınız.");
      return;
    }

    const audioTracks = localStream.getAudioTracks();

    if (audioTracks.length === 0) {
      setAudioError("Mikrofon track'i bulunamadı.");
      return;
    }

    // Sadece audio track'in enabled özelliğini değiştir
    const newMicState = !isMicOn;
    audioTracks.forEach((track) => {
      track.enabled = newMicState;
    });
    setIsMicOn(newMicState);
    setAudioError(null);
  };

  const transcriptions = [
    { speaker: "Görüşmeci", time: "00:23", text: "React konusundaki deneyimlerinizden bahseder misiniz?" },
    { speaker: "Aday", time: "00:28", text: "3 yılı aşkın süredir React ile çalışıyorum ve kurumsal projeler yürütüyorum..." },
    { speaker: "Aday", time: "00:35", text: "Redux ve TypeScript kullanarak büyük ölçekli uygulamalar geliştirdim." },
    { speaker: "Görüşmeci", time: "00:42", text: "Harika. Durum yönetimini nasıl ele alıyorsunuz?" },
  ];

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
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
              <h1 className="text-xl font-semibold text-gray-900">Mülakat Oturumu</h1>
              <p className="text-sm text-gray-600">Aday: Ahmet Yılmaz</p>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700">Süre: {formatDuration(duration)}</div>
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-hidden">
          <div
            className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center mx-auto max-w-4xl w-full"
            style={{ aspectRatio: "16/9" }}
          >
            {remoteStream ? (
              <video
                ref={mainVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-white px-6">
                <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-semibold">
                  AI
                </div>
                <h2 className="text-2xl font-semibold">
                  {isConnected ? "Aday bağlanıyor..." : "Aday Bağlantı Bekleniyor"}
                </h2>
                <p className="text-gray-300 text-sm mt-2">
                  {isConnected ? "Kamera akışı yükleniyor..." : "Adayın bağlanmasını bekliyorum."}
                </p>
                {connectionError && (
                  <p className="text-red-400 text-sm mt-2">⚠ {connectionError}</p>
                )}
                {isConnected && !connectionError && (
                  <p className="text-green-400 text-sm mt-2">● Bağlı</p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 flex-shrink-0">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden w-40" style={{ aspectRatio: "16/10" }}>
              {localStream && isVideoOn ? (
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-semibold text-white">
                      Siz
                    </div>
                    <p className="text-xs text-gray-400">Kamera kapalı</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 bg-white rounded-2xl px-8 py-5 shadow-sm">
              <button
                onClick={handleToggleMic}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors text-gray-700 ${
                  isMicOn ? "bg-gray-100" : "bg-red-100 text-red-600"
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsVideoOn((prev) => !prev)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors text-gray-700 ${
                  isVideoOn ? "bg-gray-100" : "bg-red-100 text-red-600"
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <Button
                onClick={handleInterviewAction}
                className={`px-8 py-3 rounded-full font-medium flex items-center gap-2 ${
                  isInterviewStarted
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {isInterviewStarted ? "⏹ Görüşmeyi Bitir" : "▶ Görüşmeyi Başlat"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            {videoError && (
              <p className="text-sm text-red-500 bg-white/70 rounded-lg px-4 py-2 w-full max-w-xl text-center">
                {videoError}
              </p>
            )}
            {audioError && (
              <p className="text-sm text-red-500 bg-white/70 rounded-lg px-4 py-2 w-full max-w-xl text-center">
                {audioError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto h-full">
        <div className="p-6 space-y-6">
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
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {transcriptions.map((transcript, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-purple-600">{transcript.speaker}</span>
                    <span className="text-gray-500 text-xs">({transcript.time})</span>
                  </div>
                  <p className="text-gray-700">{transcript.text}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Duygu Analizi</h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Pozitif</span>
                  <span className="font-medium text-gray-900">72%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "72%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Nötr</span>
                  <span className="font-medium text-gray-900">20%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{ width: "20%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Negatif</span>
                  <span className="font-medium text-gray-900">8%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: "8%" }}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Yapay Zekâ Skorlaması</h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">İletişim Becerileri</span>
                  <span className="font-medium text-gray-900">8.5/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Teknik Bilgi</span>
                  <span className="font-medium text-gray-900">7.8/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: "78%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Problem Çözme</span>
                  <span className="font-medium text-gray-900">8.2/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: "82%" }}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-2 border-green-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yapay Zekâ Önerisi</h2>
            <div className="text-center">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-medium mb-3">
                Güçlü Aday
              </Button>
              <p className="text-sm text-gray-700">
                Aday mülakat boyunca güçlü iletişim kurdu ve teknik becerilerini net biçimde gösterdi. Genel duygu analizi pozitif yönde.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


