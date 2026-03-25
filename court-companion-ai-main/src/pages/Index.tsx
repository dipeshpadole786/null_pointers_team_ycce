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
    <div className="h-dvh min-h-dvh flex flex-col overflow-hidden court-shell">
      <Navbar
        isRecording={stream.isRecording}
        elapsed={stream.elapsed}
        utteranceCount={stream.utterances.length}
        onExport={() => setExportOpen(true)}
        onNewSession={handleNewSession}
      />

      <div className="flex-1 min-h-0 p-3 md:p-4 lg:p-5">
        <div className="court-layout h-full">
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
          onGenerateSummary={stream.fetchSummary}
          summaryText={stream.summaryText}
          onAskQuestion={stream.askQuestion}
          qaAnswer={stream.qaAnswer}
        />
        </div>
      </div>

      <BottomBar
        isRecording={stream.isRecording}
        isProcessing={stream.isProcessing}
        onToggleRecording={handleToggleRecording}
        onUploadAudio={stream.uploadAudioFile}
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
