"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
export default function InterviewRoomPage() {
  const router = useRouter();
  const [duration, setDuration] = useState(0); // seconds
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Süreyi otomatik başlat
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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

  // Update video element when stream is available
  useEffect(() => {
    if (videoRef.current) {
      if (localStream && isVideoOn) {
        videoRef.current.srcObject = localStream;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Video autoplay prevented:", err);
          });
        }
      } else {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    }
  }, [localStream, isVideoOn]);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/interview-info")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Mülakat Oturumu</h1>
            <p className="text-sm text-gray-600">Görüşme sırasında kameranız burada görüntülenecek.</p>
          </div>
        </div>
        <div className="text-sm font-medium text-gray-700">Süre: {formatDuration(duration)}</div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr] flex-1">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden min-h-[280px] lg:min-h-[380px]">
            {localStream && isVideoOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
                <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mb-4 text-3xl font-semibold">
                  AY
                </div>
                <h2 className="text-2xl font-semibold">Ahmet Yılmaz</h2>
                <p className="text-sm text-gray-300 mt-2">Görüşme aktif</p>
              </div>
            )}

          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-5">
            <div>
              <p className="text-sm uppercase tracking-widest text-purple-500 font-semibold">Görüşmeci Görüntüsü</p>
              <h3 className="text-xl font-semibold text-gray-900 mt-1">AI Mülakat Asistanı</h3>
            </div>
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden flex-1 aspect-video">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mb-4 text-2xl font-semibold">
                  AI
                </div>
                <p className="text-lg font-semibold">Görüşmeci yayında</p>
                <p className="text-sm text-white/70 mt-1">
                  Görüşmeci sorularını aktarmak için hazır bekliyor.
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Gerçek görüşme senaryosunda, mülakatı yapan kişinin kamerası bu alanda yayınlanır.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 bg-white rounded-2xl px-8 py-5 shadow-sm">
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
            onClick={() => setIsVideoOn(!isVideoOn)}
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
        </div>

        <div className="flex flex-col gap-2">
          {videoError && (
            <p className="text-sm text-red-500 bg-white/70 rounded-lg px-4 py-2 w-full max-w-xl mx-auto text-center">
              {videoError}
            </p>
          )}
          {audioError && (
            <p className="text-sm text-red-500 bg-white/70 rounded-lg px-4 py-2 w-full max-w-xl mx-auto text-center">
              {audioError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
