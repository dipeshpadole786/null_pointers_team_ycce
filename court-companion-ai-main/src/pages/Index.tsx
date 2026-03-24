import { useState, useCallback } from 'react';
import Navbar from '@/components/court/Navbar';
import LeftPanel from '@/components/court/LeftPanel';
import CenterTranscript from '@/components/court/CenterTranscript';
import RightPanel from '@/components/court/RightPanel';
import BottomBar from '@/components/court/BottomBar';
import ExportModal from '@/components/court/ExportModal';
import { useTranscriptStream } from '@/hooks/useTranscriptStream';
import { INITIAL_CASE_META, type CaseMetadata } from '@/data/mockData';

const Index = () => {
  const stream = useTranscriptStream();
  const [caseMeta, setCaseMeta] = useState<CaseMetadata>(INITIAL_CASE_META);
  const [exportOpen, setExportOpen] = useState(false);

  const handleToggleRecording = useCallback(() => {
    if (stream.isRecording) {
      stream.stopRecording();
    } else {
      stream.startRecording();
    }
  }, [stream]);

  const handleNewSession = useCallback(() => {
    stream.stopRecording();
    setCaseMeta(INITIAL_CASE_META);
    window.location.reload();
  }, [stream]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'hsl(var(--bg-primary))' }}>
      <Navbar
        isRecording={stream.isRecording}
        elapsed={stream.elapsed}
        utteranceCount={stream.utterances.length}
        onExport={() => setExportOpen(true)}
        onNewSession={handleNewSession}
      />

      {/* Main content below navbar */}
      <div className="flex flex-1 overflow-hidden" style={{ marginTop: '52px' }}>
        <LeftPanel
          caseMeta={caseMeta}
          speakers={stream.speakers}
          stats={stream.stats}
          onCaseMetaChange={setCaseMeta}
        />
        <CenterTranscript
          utterances={stream.utterances}
          contradiction={stream.contradiction}
          onDismissContradiction={stream.dismissContradiction}
          currentStreaming={stream.currentStreaming}
        />
        <RightPanel
          utterances={stream.utterances}
          onPreviewDocument={() => setExportOpen(true)}
        />
      </div>

      <BottomBar
        isRecording={stream.isRecording}
        onToggleRecording={handleToggleRecording}
      />

      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        utterances={stream.utterances}
        caseMeta={caseMeta}
        stats={stream.stats}
        sessionHash={stream.sessionHash}
        onDownloadDocument={stream.exportDocument}
      />
    </div>
  );
};

export default Index;
