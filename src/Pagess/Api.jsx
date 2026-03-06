import { Mic, MicOff } from "lucide-react";
import { useRef, useState } from "react";

export default function SpeechToText() {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  // mic cheker and recording
  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      //  make audio file
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, {
          type: "audio/webm",
        });

        setLoading(true);
        sendAudio(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    });
  };

  // stop recording func
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  // sent audio to backend formData
  const sendAudio = (blob) => {
    const formData = new FormData();

    formData.append("file", blob);
    formData.append("language", "uz");
    formData.append("blocking", "true");
    formData.append("run_diarization", "false");

    // fetch
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
        setText(data.result.text || "Text topilmadi");
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setText("Xatolik yuz berdi");
        setLoading(false);
      });
  };

  return (
    <>
      <div className="flex w-full justify-center  gap-6 p-10">
        <h2 className="font-bold text-[36px]">Ovozni matnga aylantiring</h2>
      </div>

      <div className="flex w-full justify-center pt-30 gap-6 p-10">
        {/* mic card */}
        <div className="w-80 p-6 border rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Mikrafoni yoqing!</h2>

          <div className="pt-15">
            {!recording ? (
              <button
                onClick={startRecording}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                <Mic />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                <MicOff />
              </button>
            )}
          </div>
        </div>

        {/* wave loader */}
        {loading && (
          <div className="flex items-center gap-1">
            <span className="w-1 h-6 bg-blue-500 animate-pulse"></span>
            <span className="w-1 h-10 bg-blue-500 animate-pulse"></span>
            <span className="w-1 h-6 bg-blue-500 animate-pulse"></span>
            <span className="w-1 h-10 bg-blue-500 animate-pulse"></span>
            <span className="w-1 h-6 bg-blue-500 animate-pulse"></span>
          </div>
        )}

        {/* text card */}
        <div className="w-80 p-6 border rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Matn xolati.</h2>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <p>{text || <span className="text-gray-400">Bu yerda natija chiqadi...</span>}</p>
          )}
        </div>
      </div>
    </>
  );
}