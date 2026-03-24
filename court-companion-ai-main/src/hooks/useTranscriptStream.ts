import { useState, useEffect, useCallback, useRef } from 'react';
import { MOCK_UTTERANCES, MOCK_CONTRADICTION, type Utterance, type ContradictionAlert, type SessionStats, type SpeakerProfile, INITIAL_SPEAKERS } from '@/data/mockData';

interface StreamingState {
  utterances: Utterance[];
  currentStreaming: { utteranceIndex: number; wordIndex: number } | null;
  contradiction: ContradictionAlert | null;
  isRecording: boolean;
  speakers: SpeakerProfile[];
  stats: SessionStats;
  elapsed: number;
}

export function useTranscriptStream() {
  const [state, setState] = useState<StreamingState>({
    utterances: [],
    currentStreaming: null,
    contradiction: null,
    isRecording: false,
    speakers: INITIAL_SPEAKERS.map(s => ({ ...s })),
    stats: { duration: '00:00:00', utterances: 0, avgConfidence: 0, flagged: 0, codeSwitches: 0, rulings: 0 },
    elapsed: 0,
  });

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const streamRef = useRef<ReturnType<typeof setTimeout>>();
  const uttIndexRef = useRef(0);
  const wordIndexRef = useRef(0);
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

  const updateSpeakers = useCallback((utterances: Utterance[], base: SpeakerProfile[]) => {
    const counts: Record<string, number> = {};
    utterances.forEach(u => { counts[u.speakerId] = (counts[u.speakerId] || 0) + 1; });
    return base.map(s => ({ ...s, utteranceCount: counts[s.id] || 0 }));
  }, []);

  const streamNextWord = useCallback(() => {
    const ui = uttIndexRef.current;
    if (ui >= MOCK_UTTERANCES.length) {
      // done streaming
      setState(prev => ({ ...prev, currentStreaming: null }));
      return;
    }

    const mockUtt = MOCK_UTTERANCES[ui];
    const words = mockUtt.text.split(' ');
    const wi = wordIndexRef.current;

    if (wi === 0) {
      // Start new utterance
      const partialUtt: Utterance = { ...mockUtt, text: words[0] };
      setState(prev => {
        const newUtterances = [...prev.utterances, partialUtt];
        return {
          ...prev,
          utterances: newUtterances,
          currentStreaming: { utteranceIndex: ui, wordIndex: 0 },
          speakers: updateSpeakers(newUtterances, prev.speakers),
          stats: updateStats(newUtterances),
        };
      });
      wordIndexRef.current = 1;
      streamRef.current = setTimeout(streamNextWord, 100);
    } else if (wi < words.length) {
      // Add next word
      setState(prev => {
        const updated = [...prev.utterances];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, text: words.slice(0, wi + 1).join(' ') };
        return { ...prev, utterances: updated, currentStreaming: { utteranceIndex: ui, wordIndex: wi } };
      });
      wordIndexRef.current = wi + 1;
      streamRef.current = setTimeout(streamNextWord, 100);
    } else {
      // Finish utterance — add translation if exists
      setState(prev => {
        const updated = [...prev.utterances];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, text: mockUtt.text, translation: mockUtt.translation, codeSwitch: mockUtt.codeSwitch };
        const newStats = updateStats(updated);
        // Show contradiction after utterance 6
        const showContradiction = ui === 5 ? MOCK_CONTRADICTION : prev.contradiction;
        return { ...prev, utterances: updated, stats: newStats, contradiction: showContradiction };
      });
      uttIndexRef.current = ui + 1;
      wordIndexRef.current = 0;
      streamRef.current = setTimeout(streamNextWord, 1800);
    }
  }, [updateStats, updateSpeakers]);

  const startRecording = useCallback(() => {
    uttIndexRef.current = 0;
    wordIndexRef.current = 0;
    startTimeRef.current = Date.now();
    setState(prev => ({
      ...prev,
      isRecording: true,
      utterances: [],
      contradiction: null,
      currentStreaming: null,
      speakers: INITIAL_SPEAKERS.map(s => ({ ...s, utteranceCount: 0 })),
      stats: { duration: '00:00:00', utterances: 0, avgConfidence: 0, flagged: 0, codeSwitches: 0, rulings: 0 },
      elapsed: 0,
    }));

    timerRef.current = setInterval(() => {
      setState(prev => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        return { ...prev, elapsed, stats: { ...prev.stats, duration: formatTime(elapsed) } };
      });
    }, 1000);

    // Start streaming after 2s delay
    streamRef.current = setTimeout(streamNextWord, 2000);
  }, [streamNextWord]);

  const stopRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: false, currentStreaming: null }));
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) clearTimeout(streamRef.current);
  }, []);

  const dismissContradiction = useCallback(() => {
    setState(prev => ({ ...prev, contradiction: null }));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) clearTimeout(streamRef.current);
    };
  }, []);

  return { ...state, startRecording, stopRecording, dismissContradiction };
}
