import { useState } from 'react';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import type { CaseMetadata, SpeakerProfile, SessionStats, SpeakerRole } from '@/data/mockData';
import { ROLE_LABELS, ROLE_BADGE_CLASS } from '@/data/mockData';

interface LeftPanelProps {
  caseMeta: CaseMetadata;
  speakers: SpeakerProfile[];
  stats: SessionStats;
  onCaseMetaChange: (meta: CaseMetadata) => void;
}

const SESSION_TYPES = ['FIR Recording', 'Bail Hearing', 'Deposition', 'Cross-Examination', 'Final Arguments', 'Order Pronouncement'];
const LANGUAGES = ['Hindi', 'English', 'Hindi-English (Code-Switch)', 'Marathi', 'Tamil', 'Telugu'];
const BORDER_COLORS: Record<SpeakerRole, string> = {
  JUDGE: 'hsl(var(--court-navy))',
  ADVOCATE_P: 'hsl(var(--court-green))',
  ADVOCATE_D: 'hsl(var(--court-orange))',
  WITNESS: 'hsl(var(--court-purple))',
  CLERK: 'hsl(var(--court-grey))',
};

export default function LeftPanel({ caseMeta, speakers, stats, onCaseMetaChange }: LeftPanelProps) {
  const [caseOpen, setCaseOpen] = useState(true);

  return (
    <aside className="w-full xl:w-[280px] h-full min-h-[250px] overflow-y-auto scrollbar-court rounded-2xl border" style={{ background: 'hsl(var(--bg-panel) / 0.65)', borderColor: 'hsl(var(--border-subtle))', boxShadow: '0 8px 18px hsl(var(--court-navy) / 0.04)' }}>
      <div className="p-4 space-y-4">
        <section className="rounded-xl p-3" style={{ background: 'hsl(var(--bg-card) / 0.72)' }}>
        <button onClick={() => setCaseOpen(!caseOpen)} className="flex items-center gap-2 w-full mb-3">
          {caseOpen ? <ChevronDown size={12} style={{ color: 'hsl(var(--gold))' }} /> : <ChevronRight size={12} style={{ color: 'hsl(var(--gold))' }} />}
          <span className="label-gold">Case Details</span>
        </button>
        {caseOpen && (
          <div className="space-y-2.5">
            <input className="input-court" placeholder="Case Number" value={caseMeta.caseNumber} onChange={e => onCaseMetaChange({ ...caseMeta, caseNumber: e.target.value })} />
            <input className="input-court" placeholder="Court Name" value={caseMeta.courtName} onChange={e => onCaseMetaChange({ ...caseMeta, courtName: e.target.value })} />
            <input className="input-court" placeholder="Presiding Judge" value={caseMeta.presidingJudge} onChange={e => onCaseMetaChange({ ...caseMeta, presidingJudge: e.target.value })} />
            <input className="input-court" type="date" value={caseMeta.date} onChange={e => onCaseMetaChange({ ...caseMeta, date: e.target.value })} />
            <select className="input-court" value={caseMeta.sessionType} onChange={e => onCaseMetaChange({ ...caseMeta, sessionType: e.target.value })}>
              {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="input-court" value={caseMeta.languageMode} onChange={e => onCaseMetaChange({ ...caseMeta, languageMode: e.target.value })}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <p className="flex items-center gap-1 text-[11px] rounded-lg px-2.5 py-2" style={{ color: 'hsl(var(--text-muted))', background: 'hsl(var(--bg-light) / 0.75)' }}>
              <Lock size={10} /> All data stored locally — SQLite session DB
            </p>
          </div>
        )}
        </section>

        <section className="rounded-xl p-3" style={{ background: 'hsl(var(--bg-card) / 0.72)' }}>
        <span className="label-gold block mb-3">Detected Speakers</span>
        <div className="space-y-2">
          {speakers.map(s => (
            <div key={s.id} className="rounded-xl p-3" style={{ background: 'hsl(var(--bg-light) / 0.7)', borderLeft: `3px solid ${BORDER_COLORS[s.role]}` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px]">🎙</span>
                <span className="font-mono-court text-[11px] font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{s.id}</span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>Role:</span>
                <span className={`badge-speaker ${ROLE_BADGE_CLASS[s.role]}`}>{ROLE_LABELS[s.role]}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>Confidence:</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--bg-primary))' }}>
                  <div className="h-full rounded-full" style={{ width: `${s.confidence}%`, background: 'hsl(var(--gold))' }} />
                </div>
                <span className="font-mono-court text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>{s.confidence}%</span>
              </div>
              <span className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>Voice match: {s.utteranceCount} utterances</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-2" style={{ color: 'hsl(var(--text-muted))' }}>✎ Stenographer can reassign roles at any time</p>
        </section>

        <section className="rounded-xl p-3" style={{ background: 'hsl(var(--bg-card) / 0.72)' }}>
        <span className="label-gold block mb-3">Session Stats</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['⏱', 'Duration', stats.duration],
            ['📝', 'Utterances', stats.utterances],
            ['🎯', 'Avg Conf.', `${stats.avgConfidence}%`],
            ['⚠', 'Flagged', stats.flagged],
            ['🔄', 'Code-switch', stats.codeSwitches],
            ['📋', 'Rulings', stats.rulings],
          ].map(([icon, label, value]) => (
            <div key={label as string} className="rounded-lg p-2.5" style={{ background: 'hsl(var(--bg-light) / 0.75)' }}>
              <div className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>{icon} {label}</div>
              <div className="font-mono-court text-[13px] font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{value}</div>
            </div>
          ))}
        </div>
        </section>
      </div>
    </aside>
  );
}
