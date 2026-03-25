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
    <nav className="z-50 sticky top-0 px-3 pt-3 md:px-4 md:pt-4">
      <div className="h-auto min-h-[62px] rounded-2xl border px-3 py-2 md:px-5 md:py-3 flex flex-wrap items-center gap-3 md:gap-4 justify-between backdrop-blur-sm" style={{ background: 'hsl(var(--bg-card) / 0.84)', borderColor: 'hsl(var(--border-subtle))', boxShadow: '0 8px 18px hsl(var(--court-navy) / 0.04)' }}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-display font-bold text-[24px] leading-none" style={{ color: 'hsl(var(--gold-dark))' }}>वाक्शास्त्र</span>
          <span className="font-label text-[10px] uppercase tracking-[2px]" style={{ color: 'hsl(var(--text-muted))' }}>Courtroom AI Transcriber</span>
        </div>
      </div>

      <div className="flex items-center gap-2 order-3 w-full md:order-2 md:w-auto justify-start md:justify-center">
        {isRecording ? (
          <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: 'hsl(var(--red-alert) / 0.09)', border: '1px solid hsl(var(--red-alert) / 0.2)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'hsl(var(--red-alert))' }} />
            <span className="font-label text-[11px] uppercase tracking-[1.5px] font-bold" style={{ color: 'hsl(var(--red-alert))' }}>Recording</span>
            <span className="font-mono-court text-[11px]" style={{ color: 'hsl(var(--text-muted))' }}>{formatTime(elapsed)}</span>
          </div>
        ) : utteranceCount > 0 ? (
          <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: 'hsl(var(--gold) / 0.09)', border: '1px solid hsl(var(--gold) / 0.18)' }}>
            <span className="font-label text-[11px] uppercase tracking-[1.5px]" style={{ color: 'hsl(var(--gold))' }}>✓ Session Complete</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: 'hsl(var(--court-green) / 0.08)', border: '1px solid hsl(var(--court-green) / 0.2)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--court-green))' }} />
            <span className="font-label text-[11px] uppercase tracking-[1.5px]" style={{ color: 'hsl(var(--court-green))' }}>Offline Ready</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3 order-2 md:order-3 ml-auto">
        <button onClick={onNewSession} className="btn-ghost-court text-[10px] py-1.5 px-3">New Session</button>
        <button onClick={onExport} disabled={utteranceCount === 0} className="btn-gold text-[10px] py-1.5 px-3">Export .docx</button>
        <div className="hidden lg:flex items-center gap-1.5 rounded px-2 py-1" style={{ background: 'hsl(var(--red-alert) / 0.1)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--red-alert))' }} />
          <span className="font-label text-[9px] uppercase tracking-[1px] font-bold" style={{ color: 'hsl(var(--red-alert))' }}>Offline Mode</span>
        </div>
      </div>
      </div>
    </nav>
  );
}
