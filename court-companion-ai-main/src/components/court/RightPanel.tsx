import type { Utterance } from '@/data/mockData';

interface RightPanelProps {
  utterances: Utterance[];
  onPreviewDocument: () => void;
}

const QUICK_INSERTS = [
  'Objection Noted', 'Overruled', 'Witness Sworn In', 'Exhibit Marked',
  'Adjourned to →', 'Order Reserved', 'Bail Granted', 'Charge Framed',
  'Proceedings End', 'Custom...',
];

export default function RightPanel({ utterances, onPreviewDocument }: RightPanelProps) {
  const hasUtterances = utterances.length > 0;

  return (
    <div className="w-[280px] flex-shrink-0 h-full overflow-y-auto scrollbar-court" style={{ background: 'hsl(var(--bg-panel))', borderLeft: '1px solid hsl(var(--border-subtle))' }}>
      {/* Legal Intelligence */}
      <div className="p-4">
        <span className="label-gold block mb-3">Legal Intelligence</span>
        <div className="space-y-3">
          <EntityGroup icon="📌" title="PERSONS" items={hasUtterances ? ['Ramesh Kumar (Accused)', 'Adv. Priya Sharma (Petitioner)', 'Adv. Mehta (Respondent)'] : []} />
          <EntityGroup icon="⚖" title="SECTIONS CITED" items={hasUtterances ? ['IPC §302 — Murder', 'CrPC §164 — Statement recording', 'IEA §27 — Discovery statement'] : []} />
          <EntityGroup icon="📅" title="DATES MENTIONED" items={hasUtterances ? ['12 March 2024 (incident)', '15 April 2024 (FIR)', 'Today (hearing)'] : []} />
          <EntityGroup icon="📍" title="LOCATIONS" items={hasUtterances ? ['Andheri West, Mumbai', 'Sahar Police Station'] : []} />
          <EntityGroup icon="📁" title="EXHIBITS MARKED" items={hasUtterances ? ['Exhibit A — CCTV footage', 'Exhibit B — Medical report'] : []} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid hsl(var(--border-subtle))' }} />

      {/* Quick Inserts */}
      <div className="p-4">
        <span className="label-gold block mb-3">Quick Insert</span>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_INSERTS.map(label => (
            <button key={label} className="rounded px-2 py-1.5 text-[10px] font-label font-bold text-left transition-colors" style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-muted))' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid hsl(var(--border-subtle))' }} />

      {/* Document Structure */}
      <div className="p-4">
        <span className="label-gold block mb-3">Document Structure</span>
        <div className="space-y-1 text-[12px] font-mono-court" style={{ color: 'hsl(var(--text-muted))' }}>
          <p style={{ color: 'hsl(var(--text-primary))' }}>📄 ORDER SHEET — CC/234/2024</p>
          <p className="pl-4">{hasUtterances ? '├─ Case Header ✓' : '├─ Case Header ⏳'}</p>
          <p className="pl-4">{hasUtterances ? '├─ Appearances ✓' : '├─ Appearances ⏳'}</p>
          <p className="pl-4">├─ Proceedings ({utterances.length} entries) {hasUtterances ? '✓' : '⏳'}</p>
          <p className="pl-4">├─ Evidence Recorded (2 items) {utterances.length > 5 ? '✓' : '⏳'}</p>
          <p className="pl-4">├─ Orders Passed ({utterances.filter(u => u.type === 'order' || u.type === 'ruling').length}) {hasUtterances ? '✓' : '⏳'}</p>
          <p className="pl-4">└─ Next Date of Hearing ⏳</p>
        </div>
        <button onClick={onPreviewDocument} disabled={!hasUtterances} className="btn-gold w-full mt-3 text-[10px] py-2">
          Preview Full Document
        </button>
      </div>
    </div>
  );
}

function EntityGroup({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[12px]">{icon}</span>
        <span className="font-label text-[10px] font-bold uppercase tracking-[1px]" style={{ color: 'hsl(var(--text-muted))' }}>{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] pl-5 italic" style={{ color: 'hsl(var(--text-muted) / 0.5)' }}>Awaiting session data...</p>
      ) : (
        <ul className="pl-5 space-y-0.5">
          {items.map(item => (
            <li key={item} className="text-[11px]" style={{ color: 'hsl(var(--text-primary))' }}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
