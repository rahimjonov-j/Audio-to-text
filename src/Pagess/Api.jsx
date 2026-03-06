import { Mic, MicOff, Volume2, CheckCircle, AlertCircle, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function SpeechToText() {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(Math.min(100, (average / 255) * 150));
    
    animationRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const startRecording = async () => {
    try {
      setError("");
      setText("");
      setShowResultModal(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, {
          type: "audio/webm",
        });

        setLoading(true);
        sendAudio(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      mediaRecorder.start();
      setRecording(true);
      updateAudioLevel();
    } catch (err) {
      setError("Mikrofondan foydalanishda xatolik");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setAudioLevel(0);
    }
  };

  const sendAudio = (blob) => {
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("language", "uz");
    formData.append("blocking", "true");
    formData.append("run_diarization", "false");

    fetch("https://uzbekvoice.ai/api/v1/stt", {
      method: "POST",
      headers: {
        Authorization:
          "6586114f-b21a-4092-9662-9ef54d7e3a07:2c0c7613-189b-4b2c-ad8e-eb9cb7b29c6f",
      },
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result && data.result.text) {
          setText(data.result.text);
          setShowResultModal(true);
        } else {
          setError("Matn topilmadi");
          setShowResultModal(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("API xatoligi yuz berdi");
        setShowResultModal(true);
        setLoading(false);
      });
  };

  const closeModal = () => {
    setShowResultModal(false);
    setText("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="text-center mb-20 animate-fadeIn">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Volume2 size={40} className="text-blue-400 animate-bounce" style={{ animationDelay: "0s" }} />
            <h1 className="text-6xl font-black bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent leading-tight">
              OVOZNI<br />MATNGA
            </h1>
            <Volume2 size={40} className="text-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
          <p className="text-slate-300 text-xl font-light tracking-widest">UZBEK SPEECH RECOGNITION</p>
        </div>

        {/* Main Microphone Control Card - Full Screen Focus */}
        <div className="w-full max-w-md animate-slideUp">
          <div className="relative">
            {/* Outer glow effect */}
            <div className={`absolute inset-0 rounded-3xl blur-2xl transition-all duration-300 ${
              recording 
                ? 'bg-gradient-to-r from-red-500/30 to-pink-500/30 opacity-100' 
                : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-50'
            }`}></div>

            {/* Main card */}
            <div className="relative backdrop-blur-2xl bg-white/8 border border-white/15 rounded-3xl p-12 shadow-2xl hover:shadow-purple-500/30 transition-all duration-300">
              
              {/* Recording indicator */}
              {recording && (
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-400 font-semibold">YOZILMOQDA</span>
                </div>
              )}

              <div className="flex flex-col items-center">
                {/* Waveform Visualizer */}
                {recording && (
                  <div className="flex items-end justify-center gap-1.5 h-32 mb-12 p-8 bg-black/40 rounded-2xl border border-white/10 w-full">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 bg-gradient-to-t from-blue-500 via-cyan-400 to-purple-500 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(12, audioLevel * (0.7 + Math.sin(i) * 0.3))}px`,
                          animation: `wave 0.5s ease-in-out infinite`,
                          animationDelay: `${i * 0.05}s`,
                          boxShadow: `0 0 10px rgba(59, 130, 246, 0.5)`,
                        }}
                      ></div>
                    ))}
                  </div>
                )}

                {/* Idle State - Breathing circle */}
                {!recording && !loading && (
                  <div className="mb-12 relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute w-32 h-32 rounded-full border-2 border-blue-400/30 animate-pulse"></div>
                    <div className="absolute w-24 h-24 rounded-full border-2 border-purple-400/20 animate-pulse delay-300"></div>
                    <Mic size={48} className="text-blue-400 relative z-10" />
                  </div>
                )}

                {/* Loading State - Animated bars */}
                {loading && (
                  <div className="mb-12 flex items-end justify-center gap-2 h-32">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-3 h-24 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full"
                        style={{
                          animation: `waveLoader 1.2s ease-in-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                          boxShadow: `0 0 15px rgba(34, 211, 238, 0.6)`,
                        }}
                      ></div>
                    ))}
                  </div>
                )}

                {/* Status Text */}
                <div className="text-center mb-10">
                  {recording ? (
                    <p className="text-lg font-light text-slate-200">
                      Ovozingizni<br /><span className="text-blue-400 font-semibold">yozib olinyapman...</span>
                    </p>
                  ) : loading ? (
                    <p className="text-lg font-light text-slate-200">
                      Matn<br /><span className="text-cyan-400 font-semibold animate-pulse">aniqlanmoqda...</span>
                    </p>
                  ) : (
                    <p className="text-lg font-light text-slate-300">
                      Tayyor<br /><span className="text-slate-400 text-sm">Boshlash uchun tugmani bosing</span>
                    </p>
                  )}
                </div>

                {/* Main Button */}
                {!recording ? (
                  <button
                    onClick={startRecording}
                    disabled={loading}
                    className="group relative w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-600 shadow-2xl hover:shadow-cyan-500/60 transition-all duration-300 disabled:opacity-50 hover:scale-110 active:scale-95 flex items-center justify-center"
                  >
                    <Mic size={56} className="text-white relative z-10" />
                    <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"></div>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="group relative w-32 h-32 rounded-full bg-gradient-to-r from-red-500 to-pink-600 shadow-2xl hover:shadow-red-500/60 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
                  >
                    <MicOff size={56} className="text-white relative z-10" />
                    <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping" style={{animationDuration: '1.5s'}}></div>
                    <div className="absolute inset-2 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="fixed bottom-20 left-10 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="fixed top-1/3 right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          {/* Modal */}
          <div className="relative z-10 w-full max-w-2xl animate-slideUp">
            <div className="relative backdrop-blur-3xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 border border-white/20 rounded-3xl p-0 shadow-2xl overflow-hidden">
              
              {/* Modal header with gradient */}
              <div className="relative bg-gradient-to-r from-blue-600/40 via-purple-600/40 to-pink-600/40 border-b border-white/10 p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {error ? (
                      <div className="p-3 bg-red-500/20 rounded-full border border-red-400/30">
                        <AlertCircle size={28} className="text-red-400" />
                      </div>
                    ) : (
                      <div className="p-3 bg-green-500/20 rounded-full border border-green-400/30">
                        <CheckCircle size={28} className="text-green-400" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        {error ? "Xatolik!" : "Natija"}
                      </h2>
                      <p className="text-slate-300 text-sm mt-1">
                        {error ? "Qayta urinib ko'ring" : "Matn muvaffaqiyatli aniqlandı"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110"
                  >
                    <X size={24} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Modal content */}
              <div className="p-8">
                {error ? (
                  <div className="text-center">
                    <p className="text-red-300 text-lg mb-6">{error}</p>
                  </div>
                ) : (
                  <div>
                    {/* Text display */}
                    <div className="mb-8">
                      <div className="p-8 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-black/50 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <p className="text-white text-2xl leading-relaxed font-light">
                          {text}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-xl">
                        <p className="text-blue-400 text-sm font-semibold">BELGILAR</p>
                        <p className="text-2xl font-bold text-white mt-2">{text.length}</p>
                      </div>
                      <div className="p-4 bg-purple-500/10 border border-purple-400/20 rounded-xl">
                        <p className="text-purple-400 text-sm font-semibold">SO'ZLAR</p>
                        <p className="text-2xl font-bold text-white mt-2">{text.split(/\s+/).length}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(text);
                          alert("Matni nusxala qildim!");
                        }}
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-cyan-500/50 hover:shadow-lg"
                      >
                        📋 Nusxalash
                      </button>
                      <button
                        onClick={closeModal}
                        className="flex-1 py-4 px-6 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-300"
                      >
                        ✓ Yaxshi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes waveLoader {
          0%, 100% {
            height: 24px;
            opacity: 0.5;
          }
          50% {
            height: 80px;
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-700 {
          animation-delay: 700ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}