import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type Utterance,
  type ContradictionAlert,
  type SessionStats,
  type SpeakerProfile,
  INITIAL_SPEAKERS,
  type SpeakerRole,
} from '@/data/mockData';

interface StreamingState {
  utterances: Utterance[];
  currentStreaming: { utteranceIndex: number; wordIndex: number } | null;
  contradiction: ContradictionAlert | null;
  isRecording: boolean;
  isProcessing: boolean;
  speakers: SpeakerProfile[];
  stats: SessionStats;
  elapsed: number;
  sessionHash: string;
  lastError: string | null;
}

type BackendUtterance = {
  role: string;
  text: string;
  timestamp: string;
  type: string;
  speaker_confidence?: number;
};

type BackendTranscribeResponse = {
  utterances: BackendUtterance[];
  total: number;
  session_hash: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const ROLE_TO_SPEAKER: Record<SpeakerRole, string> = {
  JUDGE: 'SPEAKER_00',
  ADVOCATE_P: 'SPEAKER_01',
  ADVOCATE_D: 'SPEAKER_01',
  WITNESS: 'SPEAKER_02',
  CLERK: 'SPEAKER_03',
};

function mapRole(role: string): SpeakerRole {
  const normalized = (role || '').toUpperCase();
  if (normalized === 'JUDGE') return 'JUDGE';
  if (normalized === 'ADVOCATE') return 'ADVOCATE_P';
  if (normalized === 'WITNESS') return 'WITNESS';
  return 'CLERK';
}

function mapType(type: string): Utterance['type'] {
  const normalized = (type || '').toUpperCase();
  if (normalized === 'ORDER') return 'order';
  if (normalized === 'TESTIMONY') return 'testimony';
  if (normalized === 'OBJECTION') return 'objection';
  if (normalized === 'PROCEDURAL') return 'procedural';
  if (normalized === 'QUESTION') return 'evidence';
  return 'evidence';
}

function mapConfidence(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 85;
  if (value <= 1) return Math.round(value * 100);
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapUtterances(items: BackendUtterance[]): Utterance[] {
  return (items || []).map((item, index) => {
    const mappedRole = mapRole(item.role);
    return {
      id: `u_${index + 1}_${Date.now()}`,
      speakerId: ROLE_TO_SPEAKER[mappedRole],
      role: mappedRole,
      timestamp: item.timestamp || '00:00:00',
      type: mapType(item.type),
      confidence: mapConfidence(item.speaker_confidence),
      text: item.text || '',
    };
  });
}

export function useTranscriptStream() {
  const [state, setState] = useState<StreamingState>({
    utterances: [],
    currentStreaming: null,
    contradiction: null,
    isRecording: false,
    isProcessing: false,
    speakers: INITIAL_SPEAKERS.map(s => ({ ...s })),
    stats: { duration: '00:00:00', utterances: 0, avgConfidence: 0, flagged: 0, codeSwitches: 0, rulings: 0 },
    elapsed: 0,
    sessionHash: '',
    lastError: null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const updateStats = useCallback((utterances: Utterance[]) => {
    const totalConf = utterances.reduce((s, u) => s + u.confidence, 0);
    const codeSwitches = utterances.filter(u => u.codeSwitch).length;
    const rulings = utterances.filter(u => u.type === 'ruling' || u.type === 'order').length;
    return {
      duration: formatTime(Math.floor((Date.now() - startTimeRef.current) / 1000)),
      utterances: utterances.length,
      avgConfidence: utterances.length ? Math.round((totalConf / utterances.length) * 10) / 10 : 0,
      flagged: utterances.filter(u => u.confidence < 70).length + (utterances.length > 5 ? 1 : 0),
      codeSwitches,
      rulings,
    };
  }, []);

  const updateSpeakers = useCallback((utterances: Utterance[]) => {
    const counts: Record<string, number> = {};
    utterances.forEach(u => { counts[u.speakerId] = (counts[u.speakerId] || 0) + 1; });
    return INITIAL_SPEAKERS.map(s => ({ ...s, utteranceCount: counts[s.id] || 0 }));
  }, []);

  const transcribeBlob = useCallback(async (audioBlob: Blob) => {
    setState(prev => ({ ...prev, isProcessing: true, lastError: null }));

    try {
      const formData = new FormData();
      const file = new File([audioBlob], `session-${Date.now()}.webm`, { type: audioBlob.type || 'audio/webm' });
      formData.append('audio', file);

      const response = await fetch(`${API_BASE_URL}/transcribe?pro_mode=true`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed with status ${response.status}`);
      }

      const data: BackendTranscribeResponse = await response.json();
      const utterances = mapUtterances(data.utterances || []);

      setState(prev => ({
        ...prev,
        utterances,
        speakers: updateSpeakers(utterances),
        stats: updateStats(utterances),
        contradiction: null,
        currentStreaming: null,
        isProcessing: false,
        sessionHash: data.session_hash || '',
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to transcribe audio';
      setState(prev => ({ ...prev, isProcessing: false, lastError: message }));
    }
  }, [updateSpeakers, updateStats]);

  const startRecording = useCallback(() => {
    const begin = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = mediaStream;
        chunksRef.current = [];

        const recorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          await transcribeBlob(blob);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        };

        startTimeRef.current = Date.now();
        setState(prev => ({
          ...prev,
          isRecording: true,
          isProcessing: false,
          utterances: [],
          contradiction: null,
          currentStreaming: null,
          speakers: INITIAL_SPEAKERS.map(s => ({ ...s, utteranceCount: 0 })),
          stats: { duration: '00:00:00', utterances: 0, avgConfidence: 0, flagged: 0, codeSwitches: 0, rulings: 0 },
          elapsed: 0,
          sessionHash: '',
          lastError: null,
        }));

        timerRef.current = setInterval(() => {
          setState(prev => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            return { ...prev, elapsed, stats: { ...prev.stats, duration: formatTime(elapsed) } };
          });
        }, 1000);

        recorder.start(1000);
      } catch (_error) {
        setState(prev => ({ ...prev, lastError: 'Microphone access denied or unavailable.' }));
      }
    };

    begin();
  }, [transcribeBlob]);

  const stopRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: false, currentStreaming: null }));
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  const exportDocument = useCallback(() => {
    window.open(`${API_BASE_URL}/export`, '_blank', 'noopener,noreferrer');
  }, []);

  const dismissContradiction = useCallback(() => {
    setState(prev => ({ ...prev, contradiction: null }));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return { ...state, startRecording, stopRecording, dismissContradiction, exportDocument };
}
