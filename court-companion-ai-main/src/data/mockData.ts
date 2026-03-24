export type SpeakerRole = 'JUDGE' | 'ADVOCATE_P' | 'ADVOCATE_D' | 'WITNESS' | 'CLERK' | 'ACCUSED' | 'OTHER' | 'UNKNOWN';
export type UtteranceType = 'ruling' | 'testimony' | 'objection' | 'procedural' | 'order' | 'evidence';

export interface Utterance {
  id: string;
  speakerId: string;
  role: SpeakerRole;
  timestamp: string;
  type: UtteranceType;
  confidence: number;
  text: string;
  translation?: string;
  codeSwitch?: string;
  isContradiction?: boolean;
}

export interface ContradictionAlert {
  id: string;
  currentUtteranceId: string;
  conflictingTimestamp: string;
  currentText: string;
  conflictingText: string;
}

export interface SpeakerProfile {
  id: string;
  role: SpeakerRole;
  confidence: number;
  utteranceCount: number;
}

export interface CaseMetadata {
  caseNumber: string;
  courtName: string;
  presidingJudge: string;
  date: string;
  sessionType: string;
  languageMode: string;
}

export interface SessionStats {
  duration: string;
  utterances: number;
  avgConfidence: number;
  flagged: number;
  codeSwitches: number;
  rulings: number;
}

export const MOCK_UTTERANCES: Utterance[] = [
  {
    id: 'u1',
    speakerId: 'SPEAKER_00',
    role: 'JUDGE',
    timestamp: '00:00:08',
    type: 'ruling',
    confidence: 94,
    text: 'Yeh court CC slash 234 slash 2024 ke liye session mein hai. Both parties are present. Shall we proceed?',
    translation: 'This court is now in session for case CC/234/2024. Both parties are present. Shall we proceed?',
    codeSwitch: 'HI→EN',
  },
  {
    id: 'u2',
    speakerId: 'SPEAKER_01',
    role: 'ADVOCATE_P',
    timestamp: '00:00:22',
    type: 'procedural',
    confidence: 91,
    text: 'Yes, Your Honor. Petitioner is ready. Hamari side se Adv. Priya Sharma appearing.',
    translation: 'Yes, Your Honor. Petitioner is ready. From our side, Adv. Priya Sharma is appearing.',
    codeSwitch: 'EN→HI',
  },
  {
    id: 'u3',
    speakerId: 'SPEAKER_00',
    role: 'JUDGE',
    timestamp: '00:00:35',
    type: 'order',
    confidence: 96,
    text: 'Prosecution, call your first witness.',
  },
  {
    id: 'u4',
    speakerId: 'SPEAKER_01',
    role: 'ADVOCATE_P',
    timestamp: '00:00:48',
    type: 'procedural',
    confidence: 89,
    text: 'Your Honor, we call Mr. Ramesh Kumar to the stand.',
  },
  {
    id: 'u5',
    speakerId: 'SPEAKER_03',
    role: 'CLERK',
    timestamp: '00:01:02',
    type: 'procedural',
    confidence: 88,
    text: 'Witness Ramesh Kumar is being sworn in.',
  },
  {
    id: 'u6',
    speakerId: 'SPEAKER_02',
    role: 'WITNESS',
    timestamp: '00:01:20',
    type: 'testimony',
    confidence: 87,
    text: 'Mera naam Ramesh Kumar hai. Main 12 March ko Andheri West mein tha aur maine accused ko premises enter karte dekha.',
    translation: 'My name is Ramesh Kumar. I was in Andheri West on March 12 and I saw the accused enter the premises.',
  },
  {
    id: 'u7',
    speakerId: 'SPEAKER_01',
    role: 'ADVOCATE_D',
    timestamp: '00:02:14',
    type: 'objection',
    confidence: 92,
    text: 'Objection, Your Honor. The witness statement is hearsay and should not be admitted under IEA Section 60.',
  },
  {
    id: 'u8',
    speakerId: 'SPEAKER_00',
    role: 'JUDGE',
    timestamp: '00:02:28',
    type: 'ruling',
    confidence: 95,
    text: 'Objection overruled. Witness may continue. IPC Section 302 ke charges ko dhyan mein rakhte hue, testimony recorded kari jayegi.',
    translation: 'Objection overruled. Witness may continue. Keeping in mind the charges under IPC Section 302, testimony will be recorded.',
    codeSwitch: 'EN→HI',
  },
];

export const MOCK_CONTRADICTION: ContradictionAlert = {
  id: 'c1',
  currentUtteranceId: 'u6',
  conflictingTimestamp: '00:00:15',
  currentText: 'Main 12 March ko Andheri West mein tha aur maine accused ko premises enter karte dekha.',
  conflictingText: 'Main wahan nahi tha us din.',
};

export const INITIAL_SPEAKERS: SpeakerProfile[] = [
  { id: 'SPEAKER_00', role: 'JUDGE', confidence: 95, utteranceCount: 0 },
  { id: 'SPEAKER_01', role: 'ADVOCATE_P', confidence: 91, utteranceCount: 0 },
  { id: 'SPEAKER_02', role: 'WITNESS', confidence: 87, utteranceCount: 0 },
  { id: 'SPEAKER_03', role: 'CLERK', confidence: 84, utteranceCount: 0 },
  { id: 'SPEAKER_04', role: 'ACCUSED', confidence: 82, utteranceCount: 0 },
  { id: 'SPEAKER_05', role: 'OTHER', confidence: 80, utteranceCount: 0 },
  { id: 'SPEAKER_06', role: 'UNKNOWN', confidence: 75, utteranceCount: 0 },
];

export const INITIAL_CASE_META: CaseMetadata = {
  caseNumber: 'CC/234/2024',
  courtName: 'City Civil Court, Mumbai',
  presidingJudge: 'Hon\'ble Sh. R.K. Verma',
  date: new Date().toISOString().split('T')[0],
  sessionType: 'Cross-Examination',
  languageMode: 'Hindi-English (Code-Switch)',
};

export const ROLE_LABELS: Record<SpeakerRole, string> = {
  JUDGE: 'Judge',
  ADVOCATE_P: 'Advocate (P)',
  ADVOCATE_D: 'Advocate (D)',
  WITNESS: 'Witness',
  CLERK: 'Clerk',
  ACCUSED: 'Accused',
  OTHER: 'Other',
  UNKNOWN: 'Unknown',
};

export const ROLE_BADGE_CLASS: Record<SpeakerRole, string> = {
  JUDGE: 'badge-judge',
  ADVOCATE_P: 'badge-advocate-p',
  ADVOCATE_D: 'badge-advocate-d',
  WITNESS: 'badge-witness',
  CLERK: 'badge-clerk',
  ACCUSED: 'badge-advocate-d',
  OTHER: 'badge-clerk',
  UNKNOWN: 'badge-clerk',
};

export const ROLE_BORDER_CLASS: Record<SpeakerRole, string> = {
  JUDGE: 'border-left-judge',
  ADVOCATE_P: 'border-left-advocate-p',
  ADVOCATE_D: 'border-left-advocate-d',
  WITNESS: 'border-left-witness',
  CLERK: 'border-left-clerk',
  ACCUSED: 'border-left-advocate-d',
  OTHER: 'border-left-clerk',
  UNKNOWN: 'border-left-clerk',
};

export const TYPE_PILL_CLASS: Record<UtteranceType, string> = {
  ruling: 'pill-ruling',
  testimony: 'pill-testimony',
  objection: 'pill-objection',
  procedural: 'pill-procedural',
  order: 'pill-order',
  evidence: 'pill-evidence',
};
