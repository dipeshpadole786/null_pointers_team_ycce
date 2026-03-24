import { Mic } from 'lucide-react';

interface NavbarProps {
  isRecording: boolean;
  elapsed: number;
  utteranceCount: number;
  onExport: () => void;
  onNewSession: () => void;
}

export default function Navbar({ isRecording, elapsed, utteranceCount, onExport, onNewSession }: NavbarProps) {
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-4" style={{ background: 'hsl(var(--bg-primary))', borderBottom: '1px solid hsl(var(--border-subtle))' }}>
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-display font-bold text-[22px] leading-none" style={{ color: 'hsl(var(--gold))' }}>वाक्शास्त्र</span>
          <span className="font-label text-[10px] uppercase tracking-[4px]" style={{ color: 'hsl(var(--gold))' }}>VAAKSHASTRA</span>
        </div>
      </div>

      {/* Center: Status */}
      <div className="flex items-center gap-2">
        {isRecording ? (
          <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: 'hsl(var(--red-alert) / 0.15)', border: '1px solid hsl(var(--red-alert) / 0.3)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'hsl(var(--red-alert))' }} />
            <span className="font-label text-[11px] uppercase tracking-[1.5px] font-bold" style={{ color: 'hsl(var(--red-alert))' }}>Recording</span>
            <span className="font-mono-court text-[11px]" style={{ color: 'hsl(var(--text-muted))' }}>{formatTime(elapsed)}</span>
          </div>
        ) : utteranceCount > 0 ? (
          <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: 'hsl(var(--gold) / 0.1)', border: '1px solid hsl(var(--gold) / 0.2)' }}>
            <span className="font-label text-[11px] uppercase tracking-[1.5px]" style={{ color: 'hsl(var(--gold))' }}>✓ Session Complete</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: 'hsl(var(--court-green) / 0.1)', border: '1px solid hsl(var(--court-green) / 0.2)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--court-green))' }} />
            <span className="font-label text-[11px] uppercase tracking-[1.5px]" style={{ color: 'hsl(var(--court-green))' }}>Offline Ready</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button onClick={onNewSession} className="btn-ghost-court text-[10px] py-1.5 px-3">New Session</button>
        <button onClick={onExport} disabled={utteranceCount === 0} className="btn-gold text-[10px] py-1.5 px-3">Export .docx</button>
        <div className="flex items-center gap-1.5 rounded px-2 py-1" style={{ background: 'hsl(var(--red-alert) / 0.1)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--red-alert))' }} />
          <span className="font-label text-[9px] uppercase tracking-[1px] font-bold" style={{ color: 'hsl(var(--red-alert))' }}>Offline Mode</span>
        </div>
      </div>
    </nav>
  );
}
