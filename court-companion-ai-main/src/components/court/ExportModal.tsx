import { X } from 'lucide-react';
import type { Utterance, CaseMetadata, SessionStats } from '@/data/mockData';
import { ROLE_LABELS } from '@/data/mockData';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  utterances: Utterance[];
  caseMeta: CaseMetadata;
  stats: SessionStats;
  sessionHash: string;
  onDownloadDocument: () => void;
}

export default function ExportModal({ isOpen, onClose, utterances, caseMeta, stats, sessionHash, onDownloadDocument }: ExportModalProps) {
  if (!isOpen) return null;

  const hash = sessionHash || 'Not generated yet';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col xl:flex-row" style={{ background: 'rgba(16, 18, 24, 0.72)', backdropFilter: 'blur(8px)' }}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full transition-colors z-10" style={{ color: 'hsl(var(--text-muted))' }}>
        <X size={24} />
      </button>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-[700px] rounded-2xl p-6 md:p-10 shadow-2xl" style={{ background: 'hsl(var(--bg-light))', color: 'hsl(var(--text-dark))' }}>
          <div className="text-center mb-6 font-document">
            <p className="text-[14px] font-bold uppercase tracking-[2px]">In The {caseMeta.courtName}</p>
            <p className="text-[12px] uppercase tracking-[1px] mt-1">Mumbai</p>
          </div>

          <div className="flex justify-between text-[12px] font-document mb-4">
            <span>Case No.: {caseMeta.caseNumber}</span>
            <span>Date: {caseMeta.date}</span>
          </div>

          <hr className="border-[hsl(var(--text-dark)/0.2)] mb-4" />

          <p className="text-[12px] font-document font-bold mb-1">BEFORE: {caseMeta.presidingJudge}</p>

          <div className="my-4 font-document text-[12px]">
            <p>BETWEEN:</p>
            <div className="flex justify-between mt-1">
              <span>Ramesh Kumar</span>
              <span>... Petitioner</span>
            </div>
            <p className="text-center my-1 italic">vs.</p>
            <div className="flex justify-between">
              <span>State of Maharashtra</span>
              <span>... Respondent</span>
            </div>
          </div>

          <hr className="border-[hsl(var(--text-dark)/0.2)] mb-4" />

          <p className="text-[12px] font-document font-bold mb-1">APPEARANCES:</p>
          <p className="text-[12px] font-document">For Petitioner: Adv. Priya Sharma</p>
          <p className="text-[12px] font-document mb-4">For Respondent: Adv. Mehta / APP</p>

          <hr className="border-[hsl(var(--text-dark)/0.2)] mb-4" />

          <p className="text-[12px] font-document font-bold mb-3">PROCEEDINGS:</p>

          {utterances.map(u => (
            <div key={u.id} className="mb-3">
              <p className="text-[11px] font-bold font-document uppercase">
                {ROLE_LABELS[u.role]} [{u.timestamp}] [{u.type}]:
              </p>
              <p className="text-[12px] font-document leading-[1.7]">{u.text}</p>
            </div>
          ))}

          <hr className="border-[hsl(var(--text-dark)/0.2)] my-4" />

          <p className="text-[12px] font-document font-bold mb-2">ORDER:</p>
          <p className="text-[12px] font-document italic mb-6">[Auto-populated from ruling utterances]</p>

          <p className="text-[12px] font-document">Next Date: ___________</p>

          <div className="mt-8 text-right font-document text-[12px]">
            <p>Sd/-</p>
            <p className="font-bold">{caseMeta.presidingJudge}</p>
            <p>{caseMeta.date} [Court Seal]</p>
          </div>
        </div>
      </div>

      <div className="w-full xl:w-[420px] overflow-y-auto p-5 md:p-8" style={{ background: 'hsl(var(--bg-panel))', borderLeft: '1px solid hsl(var(--border-subtle))' }}>
        <h2 className="font-display text-[28px] font-bold mb-6" style={{ color: 'hsl(var(--gold))' }}>Generate Document</h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            ['Duration', stats.duration],
            ['Utterances', stats.utterances],
            ['Accuracy', `${stats.avgConfidence}%`],
            ['Sections', stats.rulings],
          ].map(([label, val]) => (
            <div key={label as string} className="rounded-xl p-3" style={{ background: 'hsl(var(--bg-card))' }}>
              <div className="text-[10px] font-label uppercase tracking-[1px]" style={{ color: 'hsl(var(--text-muted))' }}>{label}</div>
              <div className="font-mono-court text-[16px] font-bold" style={{ color: 'hsl(var(--text-primary))' }}>{val}</div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <span className="label-gold block mb-2">Format</span>
          <div className="space-y-2">
            {['CrPC Order Sheet format (standard)', 'Verbatim Transcript format', 'Summary + Orders only'].map((f, i) => (
              <label key={f} className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: 'hsl(var(--text-primary))' }}>
                <input type="radio" name="format" defaultChecked={i === 0} className="accent-[hsl(var(--gold))]" />
                {f}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <span className="label-gold block mb-2">Options</span>
          <div className="space-y-2">
            {[
              ['Include timestamps', true],
              ['Include confidence scores', true],
              ['Include extracted entities appendix', true],
              ['Include Hindi in Devanagari', true],
              ['Include English translations', false],
            ].map(([label, checked]) => (
              <label key={label as string} className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: 'hsl(var(--text-primary))' }}>
                <input type="checkbox" defaultChecked={checked as boolean} className="accent-[hsl(var(--gold))]" />
                {label as string}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-3 mb-6" style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-subtle))' }}>
          <span className="label-gold block mb-1">Session Hash</span>
          <p className="font-mono-court text-[10px] break-all" style={{ color: 'hsl(var(--text-muted))' }}>sha256: {hash}</p>
          <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--text-muted))' }}>Generated: {new Date().toISOString()} | Entries: {utterances.length} | Immutable</p>
        </div>

        <button onClick={onDownloadDocument} className="btn-gold w-full mb-3">⬇ Download .docx (CrPC format)</button>
        <div className="flex gap-2">
          <button className="btn-ghost-court flex-1 text-[10px]">📋 Copy as text</button>
          <button className="btn-ghost-court flex-1 text-[10px]">🖨 Print</button>
        </div>

        <p className="text-[10px] text-center mt-4" style={{ color: 'hsl(var(--text-muted))' }}>
          Document generated locally by python-docx — no data leaves your device.
        </p>
      </div>
    </div>
  );
}
