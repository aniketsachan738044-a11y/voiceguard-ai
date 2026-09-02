import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, Play, Pause, Square, RefreshCw, Sparkles, FileAudio, AlertCircle } from 'lucide-react';
import { convertWebmToWav } from '../utils/audioEncoder';

export function AudioInputSection({ onAnalyze, isLoading }) {
  const [activeTab, setActiveTab] = useState('mic'); // 'mic' | 'file'
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Clean up timer and audio context on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // 1. Microphone Recording Handlers
  const startRecording = async () => {
    setErrorMsg('');
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];
    setRecordTime(0);
    setIsPaused(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      // Web Audio API for visualizer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      drawWaveform();

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const rawBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          // Convert WebM to uncompressed 16kHz WAV format for 100% server compatibility
          const wavBlob = await convertWebmToWav(rawBlob);
          setAudioBlob(wavBlob);
          setAudioUrl(URL.createObjectURL(wavBlob));
        } catch (convErr) {
          console.warn("WAV conversion fallback:", convErr);
          setAudioBlob(rawBlob);
          setAudioUrl(URL.createObjectURL(rawBlob));
        }
        stream.getTracks().forEach(track => track.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setRecordTime((prev) => {
          if (prev >= 14) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Microphone error:", err);
      setErrorMsg('Microphone access denied or unavailable. Please check browser permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordTime((prev) => {
          if (prev >= 14) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (isRecording || isPaused)) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366F1');
        gradient.addColorStop(1, '#38BDF8');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
  };

  // 2. File Upload Handlers
  const handleFileChange = (e) => {
    setErrorMsg('');
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Selected file exceeds maximum limit of 15 MB.');
      return;
    }
    setSelectedFile(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  // 3. Trigger Analysis
  const handleAnalyzeClick = () => {
    if (activeTab === 'mic' && audioBlob) {
      if (recordTime < 3) {
        setErrorMsg('Please record at least 3 seconds of audio for accurate analysis.');
        return;
      }
      onAnalyze(audioBlob, `mic_recording_${Date.now()}.wav`);
    } else if (activeTab === 'file' && selectedFile) {
      onAnalyze(selectedFile, selectedFile.name);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 shadow-xl">
      
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-slate-900/60 rounded-xl border border-slate-700/50 w-fit">
        <button
          onClick={() => { setActiveTab('mic'); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'mic'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Mic className="w-4 h-4" />
          Record Voice
        </button>

        <button
          onClick={() => { setActiveTab('file'); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'file'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Audio File
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: MIC RECORDING */}
      {activeTab === 'mic' && (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/30">
          
          {/* Recording Controls */}
          <div className="flex items-center gap-4 mb-6">
            {!isRecording && !isPaused ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={startRecording}
                  disabled={isLoading}
                  className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/40 flex items-center justify-center transition-all transform hover:scale-105"
                  title="Start Recording"
                >
                  <Mic className="w-8 h-8 text-white" />
                </button>
                <span className="text-xs font-semibold text-slate-300">Click to Record</span>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                {/* Pause / Resume Button */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isPaused
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                    }`}
                    title={isPaused ? 'Resume Recording' : 'Pause Recording'}
                  >
                    {isPaused ? <Play className="w-6 h-6 fill-white ml-0.5" /> : <Pause className="w-6 h-6 fill-white" />}
                  </button>
                  <span className="text-[11px] font-bold text-slate-300">{isPaused ? 'Resume' : 'Pause'}</span>
                </div>

                {/* Stop & Save Button */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 flex items-center justify-center transition-all transform hover:scale-105"
                    title="Stop Recording"
                  >
                    <Square className="w-7 h-7 fill-white" />
                  </button>
                  <span className="text-[11px] font-bold text-rose-400">Stop & Done</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mb-4">
            <h3 className="text-base font-semibold text-slate-100">
              {isPaused ? '⏸️ Recording Paused' : isRecording ? '🔴 Recording Voice Clip...' : audioBlob ? '✅ Voice Recording Ready' : '🎙️ Click Mic to Record'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isRecording ? 'Click "Stop & Done" when finished speaking.' : 'Speak naturally for 5 to 15 seconds for best detection results.'}
            </p>
          </div>

          {/* Visualizer Canvas & Timer */}
          {isRecording && (
            <div className="w-full max-w-md flex flex-col items-center gap-3">
              <canvas ref={canvasRef} width={280} height={40} className="rounded-lg bg-slate-950/60 p-1 border border-slate-800" />
              <div className="flex items-center gap-3 text-xs font-mono font-bold text-indigo-400">
                <span>00:{recordTime < 10 ? `0${recordTime}` : recordTime} / 00:15</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(recordTime / 15) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Audio Player Preview */}
          {audioUrl && !isRecording && (
            <div className="w-full max-w-md mt-2 flex flex-col items-center gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
              <audio src={audioUrl} controls className="w-full h-10" />
              <button
                onClick={startRecording}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-record Audio
              </button>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: FILE UPLOAD */}
      {activeTab === 'file' && (
        <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-8 bg-slate-900/30 text-center transition-colors">
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.ogg,.webm,.m4a"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileAudio className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {selectedFile ? selectedFile.name : 'Drag & drop audio file here, or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: WAV, MP3, OGG, WebM, M4A (Max: 15 MB)
              </p>
            </div>
            {selectedFile && (
              <div className="mt-2 text-xs font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analyze Action Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleAnalyzeClick}
          disabled={isLoading || (activeTab === 'mic' && !audioBlob) || (activeTab === 'file' && !selectedFile)}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${
            isLoading || (activeTab === 'mic' && !audioBlob) || (activeTab === 'file' && !selectedFile)
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/30 transform hover:-translate-y-0.5'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              Running Anti-Spoofing Model...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze Audio with VoiceGuard
            </>
          )}
        </button>
      </div>

    </div>
  );
}
