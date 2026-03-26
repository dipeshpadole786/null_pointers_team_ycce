import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';

function detectDefaultApi() {
  const expoHost = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = expoHost.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:8000`;
  }
  return 'http://192.168.0.104:8000';
}

function normalizeBaseUrl(url) {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

const DEFAULT_API = detectDefaultApi();

function extractCandidateHosts() {
  const rawValues = [
    Constants.expoGoConfig?.debuggerHost,
    Constants.expoConfig?.hostUri,
    Constants.manifest2?.extra?.expoClient?.hostUri,
  ].filter(Boolean);

  const hosts = rawValues
    .map((value) => String(value).split(':')[0].trim())
    .filter((host) => host && host !== 'localhost' && host !== '127.0.0.1');

  return Array.from(new Set(hosts));
}

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API);
  const [isBusy, setIsBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [utterances, setUtterances] = useState([]);
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [backendStatus, setBackendStatus] = useState('Auto-connecting...');

  const normalizedApi = useMemo(() => normalizeBaseUrl(apiBaseUrl), [apiBaseUrl]);

  function buildUrl(path) {
    if (!normalizedApi) {
      throw new Error('Backend URL is empty. Please set backend LAN URL first.');
    }
    return `${normalizedApi}${path}`;
  }

  async function apiFetch(path, options = {}, timeoutMs = 25000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(buildUrl(path), { ...options, signal: controller.signal });
    } catch (error) {
      if (String(error?.message || error).includes('Network request failed')) {
        throw new Error(
          `Network request failed. Ensure backend is running and phone can reach ${normalizedApi}. Use laptop LAN IP (same Wi-Fi), not localhost.`
        );
      }
      if (String(error?.message || error).includes('aborted')) {
        throw new Error('Request timed out. Check backend logs and network connection.');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function probeBaseUrl(baseUrl, timeoutMs = 4000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}/`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Backend responded ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
    finally {
      clearTimeout(timer);
    }
  }

  async function autoConnectBackend(showAlert = false) {
    setIsBusy(true);
    try {
      const candidates = [];
      const current = normalizeBaseUrl(apiBaseUrl);
      if (current) candidates.push(current);

      for (const host of extractCandidateHosts()) {
        candidates.push(`http://${host}:8000`);
      }

      if (DEFAULT_API) candidates.push(normalizeBaseUrl(DEFAULT_API));

      const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));

      for (const candidate of uniqueCandidates) {
        const data = await probeBaseUrl(candidate);
        if (data) {
          setApiBaseUrl(candidate);
          setBackendStatus(`Connected: ${candidate}`);
          if (showAlert) {
            Alert.alert('Backend Connected', `Connected to ${candidate}`);
          }
          return;
        }
      }

      const failedMessage = `Could not auto-connect backend. Start backend and ensure phone/laptop are on same Wi-Fi.`;
      setBackendStatus(failedMessage);
      if (showAlert) {
        Alert.alert('Connection Failed', failedMessage);
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function testBackendConnection() {
    await autoConnectBackend(true);
  }

  useEffect(() => {
    autoConnectBackend(false);
  }, []);

  async function fetchSessionAndStats() {
    setIsBusy(true);
    try {
      const [sessionRes, statsRes] = await Promise.all([
        apiFetch('/session'),
        apiFetch('/stats'),
      ]);

      if (!sessionRes.ok) throw new Error('Failed to fetch session');
      if (!statsRes.ok) throw new Error('Failed to fetch stats');

      const sessionData = await sessionRes.json();
      const statsData = await statsRes.json();

      setUtterances(sessionData.utterances || []);
      setStats(statsData);
      setBackendStatus('Connected');
    } catch (error) {
      Alert.alert('Error', String(error.message || error));
    } finally {
      setIsBusy(false);
    }
  }

  async function transcribeFile(fileUri, filename = 'audio.m4a', mimeType = 'audio/m4a') {
    setIsBusy(true);
    try {
      const form = new FormData();
      form.append('audio', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      });

      const response = await apiFetch('/transcribe?pro_mode=true', {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Transcription failed');
      }

      await fetchSessionAndStats();
      setBackendStatus('Connected');
      Alert.alert('Success', 'Audio transcribed successfully.');
    } catch (error) {
      Alert.alert('Error', String(error.message || error));
    } finally {
      setIsBusy(false);
    }
  }

  async function pickAndTranscribeAudio() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (picked.canceled || !picked.assets?.length) return;

      const file = picked.assets[0];
      await transcribeFile(file.uri, file.name || 'upload.m4a', file.mimeType || 'audio/m4a');
    } catch (error) {
      Alert.alert('Error', String(error.message || error));
    }
  }

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow microphone permission.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', String(error.message || error));
    }
  }

  async function stopRecordingAndTranscribe() {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        Alert.alert('Error', 'No recording file found.');
        return;
      }

      await transcribeFile(uri, 'recording.m4a', 'audio/m4a');
    } catch (error) {
      Alert.alert('Error', String(error.message || error));
      setRecording(null);
      setIsRecording(false);
    }
  }

  async function getSummary() {
    setIsBusy(true);
    try {
      const response = await apiFetch('/summary');

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Summary generation failed');
      }
      const data = await response.json();
      setSummary(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      setBackendStatus('Connected');
    } catch (error) {
      Alert.alert('Error', String(error.message || error));
    } finally {
      setIsBusy(false);
    }
  }

  async function askQuestion() {
    if (!question.trim()) return;

    setIsBusy(true);
    try {
      const response = await apiFetch('/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Q&A failed');
      }
      const data = await response.json();
      setAnswer(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      setBackendStatus('Connected');
    } catch (error) {
      Alert.alert('Error', String(error.message || error));
    } finally {
      setIsBusy(false);
    }
  }

  async function openExport() {
    try {
      const exportUrl = `${normalizedApi}/export`;
      const supported = await Linking.canOpenURL(exportUrl);
      if (!supported) {
        Alert.alert('Error', 'Cannot open export URL on this device.');
        return;
      }
      await Linking.openURL(exportUrl);
    } catch (error) {
      Alert.alert('Error', String(error.message || error));
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Vaakshastra Mobile</Text>
        <Text style={styles.subtitle}>Courtroom AI Transcriber (Expo)</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Backend Base URL (LAN IP)</Text>
          <TextInput
            style={styles.input}
            value={apiBaseUrl}
            onChangeText={setApiBaseUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://192.168.1.x:8000"
          />
          <Text style={styles.hint}>Auto-detected from Expo LAN host. Edit only if needed.</Text>
          <Text style={styles.hint}>Status: {backendStatus}</Text>
          <ActionButton label="Reconnect Backend" onPress={testBackendConnection} disabled={isBusy} />
        </View>

        <View style={styles.row}>
          <ActionButton label="Upload Audio" onPress={pickAndTranscribeAudio} disabled={isBusy || isRecording} />
          <ActionButton label="Refresh" onPress={fetchSessionAndStats} disabled={isBusy} />
        </View>

        <View style={styles.row}>
          {!isRecording ? (
            <ActionButton label="Start Recording" onPress={startRecording} disabled={isBusy} tone="warn" />
          ) : (
            <ActionButton label="Stop + Transcribe" onPress={stopRecordingAndTranscribe} disabled={isBusy} tone="danger" />
          )}
          <ActionButton label="Export DOCX" onPress={openExport} disabled={isBusy} />
        </View>

        <View style={styles.row}>
          <ActionButton label="Generate Summary" onPress={getSummary} disabled={isBusy} />
          <ActionButton label="Ask Question" onPress={askQuestion} disabled={isBusy || !question.trim()} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Question on Record</Text>
          <TextInput
            style={[styles.input, styles.multiInput]}
            value={question}
            onChangeText={setQuestion}
            multiline
            placeholder="Ask from session context..."
          />
          {!!answer && <Text style={styles.answer}>{answer}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Stats</Text>
          <Text style={styles.pre}>{stats ? JSON.stringify(stats, null, 2) : 'No stats yet.'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Summary</Text>
          <Text style={styles.pre}>{summary || 'No summary yet.'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Transcript ({utterances.length})</Text>
          <FlatList
            data={utterances}
            keyExtractor={(item, idx) => `${item.timestamp || 't'}-${idx}`}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.utteranceItem}>
                <Text style={styles.utteranceMeta}>{item.role || 'UNKNOWN'} • {item.type || 'STATEMENT'} • {item.timestamp || '--:--:--'}</Text>
                <Text style={styles.utteranceText}>{item.text || ''}</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress, disabled, tone = 'normal' }) {
  const background = tone === 'danger' ? '#a2281f' : tone === 'warn' ? '#8b5e12' : '#1f3f69';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: disabled ? '#9ca3af' : background }]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4efe8' },
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#7a3b08' },
  subtitle: { fontSize: 13, color: '#475569', marginBottom: 8 },
  card: {
    backgroundColor: '#fffdf9',
    borderWidth: 1,
    borderColor: '#e7dbca',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#7a3b08', textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: '#d8c8b2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  multiInput: { minHeight: 70, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#6b7280' },
  row: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  answer: { fontSize: 13, color: '#1f2937' },
  pre: { fontSize: 12, color: '#334155' },
  utteranceItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee2d3',
    gap: 4,
  },
  utteranceMeta: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  utteranceText: { fontSize: 14, color: '#111827' },
});
