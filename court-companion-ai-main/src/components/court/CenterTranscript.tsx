import { useState, useRef, useEffect } from 'react';
import { Search, Check, Flag, X } from 'lucide-react';
import type { Utterance, ContradictionAlert, SpeakerRole } from '@/data/mockData';
import { ROLE_LABELS, ROLE_BADGE_CLASS, ROLE_BORDER_CLASS, TYPE_PILL_CLASS } from '@/data/mockData';

interface CenterTranscriptProps {
  utterances: Utterance[];
  contradiction: ContradictionAlert | null;
  onDismissContradiction: () => void;
  currentStreaming: { utteranceIndex: number; wordIndex: number } | null;
}

const FILTERS: { label: string; value: string }[] = [
  { label: 'ALL', value: 'all' },
  { label: 'JUDGE', value: 'JUDGE' },
  { label: 'ADVOCATE', value: 'ADVOCATE' },
  { label: 'WITNESS', value: 'WITNESS' },
  { label: '⚠ FLAGGED', value: 'flagged' },
];

export default function CenterTranscript({ utterances, contradiction, onDismissContradiction, currentStreaming }: CenterTranscriptProps) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [utterances, contradiction]);

  const filtered = utterances.filter(u => {
    if (filter === 'flagged') return u.confidence < 90;
    if (filter === 'ADVOCATE') return u.role === 'ADVOCATE_P' || u.role === 'ADVOCATE_D';
    if (filter !== 'all') return u.role === filter;
    return true;
  }).filter(u => {
    if (!search) return true;
    return u.text.toLowerCase().includes(search.toLowerCase());
  });

  const getConfidenceStyle = (conf: number) => {
    if (conf >= 90) return { borderBottom: '2px solid hsl(var(--court-green))', borderStyle: 'solid' as const };
    if (conf >= 70) return { borderBottom: '2px dashed hsl(var(--gold))' };
    return { borderBottom: '2px dotted hsl(var(--red-alert))' };
  };

  // Find where contradiction should be inserted (after utterance u6)
  const contradictionAfterIndex = contradiction ? filtered.findIndex(u => u.id === contradiction.currentUtteranceId) : -1;

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: 'hsl(var(--bg-primary))' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
        <span className="label-gold flex-shrink-0">Live Transcript</span>
        <div className="flex items-center gap-2 flex-1 max-w-[240px]">
          <Search size={12} style={{ color: 'hsl(var(--text-muted))' }} />
          <input
            className="input-court text-[12px] py-1"
            placeholder="Search transcript..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[1px] transition-all"
              style={{
                background: filter === f.value ? 'hsl(var(--gold) / 0.15)' : 'transparent',
                color: filter === f.value ? 'hsl(var(--gold))' : 'hsl(var(--text-muted))',
                border: `1px solid ${filter === f.value ? 'hsl(var(--gold) / 0.3)' : 'transparent'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transcript feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-court p-4 space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <span className="text-[48px]">⚖</span>
            <span className="font-display text-[18px]" style={{ color: 'hsl(var(--text-muted))' }}>Press record to begin court session</span>
          </div>
        )}
        {filtered.map((u, idx) => (
          <div key={u.id}>
            <UtteranceBlock utterance={u} getConfidenceStyle={getConfidenceStyle} />
            {idx === contradictionAfterIndex && contradiction && (
              <ContradictionBlock alert={contradiction} onDismiss={onDismissContradiction} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UtteranceBlock({ utterance: u, getConfidenceStyle }: { utterance: Utterance; getConfidenceStyle: (c: number) => React.CSSProperties }) {
  return (
    <div className={`rounded-md p-4 animate-utterance-enter ${ROLE_BORDER_CLASS[u.role]}`} style={{ background: 'hsl(var(--bg-card))' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span className={`badge-speaker ${ROLE_BADGE_CLASS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
        <span className="font-mono-court text-[11px]" style={{ color: 'hsl(var(--text-muted))' }}>{u.speakerId}</span>
        <span className="font-mono-court text-[11px]" style={{ color: 'hsl(var(--text-muted))' }}>{u.timestamp}</span>
        <span className="font-mono-court text-[11px]" style={{ color: u.confidence >= 90 ? 'hsl(var(--court-green))' : u.confidence >= 70 ? 'hsl(var(--gold))' : 'hsl(var(--red-alert))' }}>{u.confidence}%</span>
        {u.codeSwitch && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: 'hsl(180 40% 40% / 0.15)', color: 'hsl(180 40% 55%)' }}>{u.codeSwitch}</span>
        )}
      </div>
      {/* Type tag */}
      <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-[1px] mb-2 ${TYPE_PILL_CLASS[u.type]}`}>▌ {u.type}</span>
      {/* Text */}
      <p className="font-mono-court text-[14px] leading-[1.9]" style={{ color: 'hsl(var(--text-primary))', ...getConfidenceStyle(u.confidence) }}>
        "{u.text}"
      </p>
      {/* Translation */}
      {u.translation && (
        <p className="font-label text-[12px] italic mt-1.5 leading-[1.6]" style={{ color: 'hsl(var(--text-muted))' }}>
          {u.translation}
        </p>
      )}
      {/* Actions */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>✎ Click to edit inline</span>
        <div className="flex items-center gap-2">
          <button className="p-1 rounded transition-colors hover:bg-[hsl(var(--court-green)/0.1)]"><Check size={12} style={{ color: 'hsl(var(--court-green))' }} /></button>
          <button className="p-1 rounded transition-colors hover:bg-[hsl(var(--gold)/0.1)]"><Flag size={12} style={{ color: 'hsl(var(--gold))' }} /></button>
          <button className="p-1 rounded transition-colors hover:bg-[hsl(var(--red-alert)/0.1)]"><X size={12} style={{ color: 'hsl(var(--red-alert))' }} /></button>
        </div>
      </div>
    </div>
  );
}

function ContradictionBlock({ alert, onDismiss }: { alert: ContradictionAlert; onDismiss: () => void }) {
  return (
    <div className="rounded-md p-4 my-3 animate-contradiction-slide" style={{ background: 'hsl(var(--red-alert) / 0.12)', border: '1px solid hsl(var(--red-alert) / 0.3)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[14px]">⚠</span>
        <span className="font-label text-[12px] font-bold uppercase tracking-[1.5px]" style={{ color: 'hsl(var(--red-alert))' }}>Contradiction Detected</span>
      </div>
      <p className="font-mono-court text-[12px] mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
        Witness stated [{alert.conflictingTimestamp}]: "{alert.conflictingText}"
      </p>
      <p className="font-mono-court text-[12px] mb-3" style={{ color: 'hsl(var(--text-primary))' }}>
        Conflicts with current testimony: "{alert.currentText.substring(0, 80)}..."
      </p>
      <div className="flex gap-2">
        <button className="btn-ghost-court text-[9px] py-1 px-2">View Both</button>
        <button className="btn-ghost-court text-[9px] py-1 px-2">Mark for Review</button>
        <button onClick={onDismiss} className="btn-ghost-court text-[9px] py-1 px-2">Dismiss</button>
      </div>
    </div>
  );
}
