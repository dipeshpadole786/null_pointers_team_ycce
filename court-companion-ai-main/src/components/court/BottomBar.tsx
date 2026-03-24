import { useRef, useEffect, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';

interface BottomBarProps {
  isRecording: boolean;
  isProcessing: boolean;
  onToggleRecording: () => void;
  onUploadAudio: (file: File) => void;
}

export default function BottomBar({ isRecording, isProcessing, onToggleRecording, onUploadAudio }: BottomBarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const barCount = 50;
    const barWidth = (w / barCount) * 0.6;
    const gap = w / barCount;
    const time = Date.now() / 1000;

    for (let i = 0; i < barCount; i++) {
      const x = i * gap + gap * 0.2;
      let barH: number;

      if (isRecording) {
        barH = (Math.sin(time * 3 + i * 0.4) * 0.5 + 0.5) * h * 0.7 + h * 0.1;
        const gradient = ctx.createLinearGradient(x, h, x, h - barH);
        gradient.addColorStop(0, 'hsla(42, 55%, 53%, 0.8)');
        gradient.addColorStop(1, 'hsla(42, 55%, 53%, 0.2)');
        ctx.fillStyle = gradient;
      } else {
        barH = 2;
        ctx.fillStyle = 'hsla(33, 10%, 49%, 0.3)';
      }

      ctx.fillRect(x, h - barH, barWidth, barH);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [isRecording]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(2, 2);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [draw]);

  const handlePickAudio = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadAudio(file);
    }
    event.target.value = '';
  }, [onUploadAudio]);

  return (
    <div className="h-[80px] flex items-center px-4 gap-4 flex-shrink-0" style={{ background: 'hsl(var(--bg-primary))', borderTop: '1px solid hsl(var(--gold))' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: Tech info */}
      <div className="flex flex-col gap-0.5 w-[220px] flex-shrink-0">
        <span className="font-mono-court text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>
          🎙 MediaRecorder → ws://localhost:8000
        </span>
        <span className="font-mono-court text-[10px]" style={{ color: 'hsl(var(--gold))' }}>
          {isProcessing ? '⏳ Processing audio...' : '⚡ ~3s latency (whisper.cpp CPU)'}
        </span>
      </div>

      {/* Waveform */}
      <div className="flex-1 h-[50px] relative">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Record button */}
      <button
        onClick={onToggleRecording}
        disabled={isProcessing}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isRecording ? 'animate-record-pulse' : ''}`}
        style={{
          background: isRecording ? 'hsl(var(--red-alert))' : 'transparent',
          border: `3px solid ${isRecording ? 'hsl(var(--gold))' : 'hsl(var(--gold))'}`,
          boxShadow: isRecording ? '0 0 20px hsl(var(--gold) / 0.3)' : 'none',
          opacity: isProcessing ? 0.6 : 1,
        }}
      >
        {isRecording ? (
          <Square size={20} style={{ color: 'hsl(var(--text-primary))' }} />
        ) : (
          <Mic size={24} style={{ color: 'hsl(var(--gold))' }} />
        )}
      </button>

      <button
        onClick={handlePickAudio}
        disabled={isRecording || isProcessing}
        className="btn-ghost-court text-[10px] py-2 px-3"
        style={{ opacity: isRecording || isProcessing ? 0.5 : 1 }}
      >
        Upload Audio
      </button>

      {/* Right: Audio level */}
      <div className="flex flex-col items-center gap-1 w-[80px] flex-shrink-0">
        <div className="flex items-end gap-1 h-[30px]">
          {[0.3, 0.6, 0.9, 0.7, 0.4].map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-sm transition-all"
              style={{
                height: isRecording ? `${h * 30}px` : '3px',
                background: isRecording ? 'hsl(var(--gold))' : 'hsl(var(--text-muted) / 0.3)',
                animation: isRecording ? `bar-bounce ${0.5 + i * 0.1}s ease-in-out infinite` : 'none',
              }}
            />
          ))}
        </div>
        <span className="text-[9px] font-label" style={{ color: isRecording ? 'hsl(var(--court-green))' : 'hsl(var(--text-muted))' }}>
          {isRecording ? 'Noise OK' : 'Idle'}
        </span>
      </div>
    </div>
  );
}
