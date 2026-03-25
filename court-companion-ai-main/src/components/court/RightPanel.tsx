import { useState } from 'react';
import type { Utterance } from '@/data/mockData';

interface RightPanelProps {
  utterances: Utterance[];
  onPreviewDocument: () => void;
  onGenerateSummary: () => void;
  summaryText: string;
  onAskQuestion: (question: string) => void;
  qaAnswer: string;
}

const QUICK_INSERTS = [
  'Objection Noted', 'Overruled', 'Witness Sworn In', 'Exhibit Marked',
  'Adjourned to →', 'Order Reserved', 'Bail Granted', 'Charge Framed',
  'Proceedings End', 'Custom...',
];

export default function RightPanel({
  utterances,
  onPreviewDocument,
  onGenerateSummary,
  summaryText,
  onAskQuestion,
  qaAnswer,
}: RightPanelProps) {
  const [question, setQuestion] = useState('');
  const hasUtterances = utterances.length > 0;

  return (
    <aside className="w-full xl:w-[320px] h-full min-h-[250px] overflow-y-auto scrollbar-court rounded-2xl border" style={{ background: 'hsl(var(--bg-panel) / 0.65)', borderColor: 'hsl(var(--border-subtle))', boxShadow: '0 8px 18px hsl(var(--court-navy) / 0.04)' }}>
      <div className="p-4 space-y-4">
        <section className="rounded-xl p-3" style={{ background: 'hsl(var(--bg-card) / 0.72)' }}>
        <span className="label-gold block mb-3">Legal Intelligence</span>
        <div className="space-y-3">
          <EntityGroup icon="📌" title="PERSONS" items={hasUtterances ? ['Ramesh Kumar (Accused)', 'Adv. Priya Sharma (Petitioner)', 'Adv. Mehta (Respondent)'] : []} />
          <EntityGroup icon="⚖" title="SECTIONS CITED" items={hasUtterances ? ['IPC §302 — Murder', 'CrPC §164 — Statement recording', 'IEA §27 — Discovery statement'] : []} />
          <EntityGroup icon="📅" title="DATES MENTIONED" items={hasUtterances ? ['12 March 2024 (incident)', '15 April 2024 (FIR)', 'Today (hearing)'] : []} />
          <EntityGroup icon="📍" title="LOCATIONS" items={hasUtterances ? ['Andheri West, Mumbai', 'Sahar Police Station'] : []} />
          <EntityGroup icon="📁" title="EXHIBITS MARKED" items={hasUtterances ? ['Exhibit A — CCTV footage', 'Exhibit B — Medical report'] : []} />
        </div>
        </section>

        <section className="rounded-xl p-3" style={{ background: 'hsl(var(--bg-card) / 0.72)' }}>
        <span className="label-gold block mb-3">Quick Insert</span>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_INSERTS.map(label => (
            <button key={label} className="rounded-lg px-2 py-1.5 text-[10px] font-label font-semibold text-left transition-colors" style={{ background: 'hsl(var(--bg-light) / 0.8)', color: 'hsl(var(--text-muted))' }}>
              {label}
            </button>
          ))}
        </div>
        </section>

        <section className="rounded-xl p-3" style={{ background: 'hsl(var(--bg-card) / 0.72)' }}>
        <span className="label-gold block mb-3">Document Structure</span>
        <div className="space-y-1 text-[12px] font-mono-court rounded-xl p-3" style={{ color: 'hsl(var(--text-muted))', background: 'hsl(var(--bg-light) / 0.7)' }}>
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

        <button onClick={onGenerateSummary} disabled={!hasUtterances} className="btn-ghost-court w-full mt-2 text-[10px] py-2">
          Generate Summary
        </button>

        {summaryText && (
          <div className="rounded-xl p-3 mt-2" style={{ background: 'hsl(var(--bg-light) / 0.78)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[1px]" style={{ color: 'hsl(var(--gold))' }}>Summary</p>
            <p className="text-[11px] whitespace-pre-wrap" style={{ color: 'hsl(var(--text-primary))' }}>{summaryText}</p>
          </div>
        )}

        <div className="rounded-xl p-3 mt-3" style={{ background: 'hsl(var(--bg-light) / 0.78)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[1px] mb-2" style={{ color: 'hsl(var(--gold))' }}>Ask On Record</p>
          <textarea
            className="input-court min-h-[70px]"
            placeholder="Ask a question about the generated legal record..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
          <button
            className="btn-ghost-court w-full mt-2 text-[10px] py-2"
            disabled={!hasUtterances || !question.trim()}
            onClick={() => onAskQuestion(question)}
          >
            Ask Question
          </button>
          {qaAnswer && (
            <p className="text-[11px] mt-2" style={{ color: 'hsl(var(--text-primary))' }}>{qaAnswer}</p>
          )}
        </div>
        </section>
      </div>
    </aside>
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
