import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as DocumentPicker from 'expo-document-picker'
import { useNavigation } from '@react-navigation/native'
import { parseFile } from '../lib/fileParser'
import { parseStatement } from '../lib/claude'
import { useApp } from '../context/AppContext'

const COLORS = {
  bg: '#0a0d16',
  card: '#131928',
  border: 'rgba(255,255,255,0.08)',
  accent: '#7c3aed',
  success: '#059669',
  danger: '#dc2626',
  text: '#e2e8f0',
  muted: '#64748b',
  inputBg: '#1e2538',
}

export default function UploadScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { data, addTransactions } = useApp()

  const [activeTab, setActiveTab] = useState('file') // 'file' | 'paste'

  // File tab state
  const [pickedFile, setPickedFile] = useState(null)
  const [fileStatus, setFileStatus] = useState('idle') // idle | parsing | extracting | done | error
  const [fileMessage, setFileMessage] = useState('')

  // Paste tab state
  const [pastedText, setPastedText] = useState('')
  const [pasteStatus, setPasteStatus] = useState('idle')
  const [pasteMessage, setPasteMessage] = useState('')

  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'application/pdf', '*/*'],
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      const asset = result.assets[0]
      setPickedFile(asset)
      setFileStatus('idle')
      setFileMessage('')
    } catch (err) {
      setFileStatus('error')
      setFileMessage(`Failed to pick file: ${err.message}`)
    }
  }

  async function handleAnalyzeFile() {
    if (!pickedFile) {
      Alert.alert('No file selected', 'Please pick a file first.')
      return
    }
    if (!data.settings.apiKey) {
      Alert.alert(
        'API Key Required',
        'Please add your Claude API key in the Settings tab first.',
        [{ text: 'Go to Settings', onPress: () => navigation.navigate('Settings') }, { text: 'Cancel' }]
      )
      return
    }

    setFileStatus('parsing')
    setFileMessage(`Reading ${pickedFile.name}…`)

    const parsed = await parseFile(pickedFile.uri, pickedFile.name)
    if (!parsed.success) {
      setFileStatus('error')
      setFileMessage(parsed.error)
      return
    }

    try {
      setFileStatus('extracting')
      setFileMessage('Sending to Claude AI for extraction…')

      const result = await parseStatement(parsed.text, data.settings.apiKey)
      const added = result.transactions || []
      addTransactions(added)

      setFileStatus('done')
      setFileMessage(`Successfully imported ${added.length} transaction(s)!`)
    } catch (err) {
      setFileStatus('error')
      setFileMessage(`Claude error: ${err.message}`)
    }
  }

  async function handleAnalyzePaste() {
    const text = pastedText.trim()
    if (!text) {
      Alert.alert('No text', 'Please paste some bank statement text first.')
      return
    }
    if (!data.settings.apiKey) {
      Alert.alert(
        'API Key Required',
        'Please add your Claude API key in the Settings tab first.',
        [{ text: 'Go to Settings', onPress: () => navigation.navigate('Settings') }, { text: 'Cancel' }]
      )
      return
    }

    try {
      setPasteStatus('extracting')
      setPasteMessage('Sending to Claude AI for extraction…')

      const result = await parseStatement(text, data.settings.apiKey)
      const added = result.transactions || []
      addTransactions(added)

      setPasteStatus('done')
      setPasteMessage(`Successfully imported ${added.length} transaction(s)!`)
    } catch (err) {
      setPasteStatus('error')
      setPasteMessage(`Claude error: ${err.message}`)
    }
  }

  function StatusBadge({ status, message }) {
    if (status === 'idle') return null
    const isLoading = status === 'parsing' || status === 'extracting'
    const isSuccess = status === 'done'
    const bgColor = isSuccess ? '#059669' + '22' : status === 'error' ? '#dc2626' + '22' : '#7c3aed' + '22'
    const textColor = isSuccess ? COLORS.success : status === 'error' ? COLORS.danger : COLORS.accent

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor, borderColor: textColor + '44' }]}>
        {isLoading && <ActivityIndicator size="small" color={textColor} style={{ marginRight: 8 }} />}
        {isSuccess && <Text style={{ marginRight: 8 }}>✅</Text>}
        {status === 'error' && <Text style={{ marginRight: 8 }}>❌</Text>}
        <Text style={[styles.statusText, { color: textColor }]}>{message}</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.pageTitle}>Import Statement</Text>
        <Text style={styles.pageSubtitle}>
          Import a CSV or TXT bank statement, or paste text copied from a PDF.
          Claude AI extracts all transactions automatically.
        </Text>

        {/* Tab selector */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'file' && styles.tabButtonActive]}
            onPress={() => setActiveTab('file')}
          >
            <Text style={[styles.tabLabel, activeTab === 'file' && styles.tabLabelActive]}>
              Upload File
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'paste' && styles.tabButtonActive]}
            onPress={() => setActiveTab('paste')}
          >
            <Text style={[styles.tabLabel, activeTab === 'paste' && styles.tabLabelActive]}>
              Paste Text
            </Text>
          </TouchableOpacity>
        </View>

        {/* File Tab */}
        {activeTab === 'file' && (
          <View>
            <TouchableOpacity style={styles.dropZone} onPress={handlePickFile} activeOpacity={0.7}>
              <Text style={styles.dropIcon}>📄</Text>
              <Text style={styles.dropTitle}>
                {pickedFile ? pickedFile.name : 'Tap to pick a file'}
              </Text>
              <Text style={styles.dropSub}>CSV or TXT bank export</Text>
            </TouchableOpacity>

            {pickedFile && (
              <View style={styles.fileInfo}>
                <Text style={styles.fileInfoText}>
                  {pickedFile.name} ({pickedFile.size ? `${(pickedFile.size / 1024).toFixed(1)} KB` : 'unknown size'})
                </Text>
              </View>
            )}

            <StatusBadge status={fileStatus} message={fileMessage} />

            <TouchableOpacity
              style={[styles.analyzeButton, (!pickedFile || fileStatus === 'parsing' || fileStatus === 'extracting') && styles.analyzeButtonDisabled]}
              onPress={handleAnalyzeFile}
              disabled={!pickedFile || fileStatus === 'parsing' || fileStatus === 'extracting'}
            >
              {(fileStatus === 'parsing' || fileStatus === 'extracting')
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.analyzeButtonText}>Analyze with Claude</Text>
              }
            </TouchableOpacity>

            {fileStatus === 'done' && (
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation.navigate('Transactions')}
              >
                <Text style={styles.viewButtonText}>View Transactions →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Paste Tab */}
        {activeTab === 'paste' && (
          <View>
            <Text style={styles.pasteLabel}>
              Open your bank's PDF statement, select all text, copy it, and paste it below.
            </Text>
            <TextInput
              style={styles.pasteInput}
              multiline
              numberOfLines={12}
              value={pastedText}
              onChangeText={t => { setPastedText(t); setPasteStatus('idle') }}
              placeholder="Paste bank statement text here…"
              placeholderTextColor={COLORS.muted}
              textAlignVertical="top"
            />

            <StatusBadge status={pasteStatus} message={pasteMessage} />

            <TouchableOpacity
              style={[styles.analyzeButton, (!pastedText.trim() || pasteStatus === 'extracting') && styles.analyzeButtonDisabled]}
              onPress={handleAnalyzePaste}
              disabled={!pastedText.trim() || pasteStatus === 'extracting'}
            >
              {pasteStatus === 'extracting'
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.analyzeButtonText}>Analyze with Claude</Text>
              }
            </TouchableOpacity>

            {pasteStatus === 'done' && (
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation.navigate('Transactions')}
              >
                <Text style={styles.viewButtonText}>View Transactions →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for best results</Text>
          <Text style={styles.tipItem}>• CSV files work best with columns: Date, Description, Amount</Text>
          <Text style={styles.tipItem}>• For PDFs: open in your Files app, select all text, and copy</Text>
          <Text style={styles.tipItem}>• Duplicate transactions are automatically filtered out</Text>
          <Text style={styles.tipItem}>• Your data is only sent to Claude AI — never stored on any server</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#131928',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#7c3aed',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#fff',
  },
  dropZone: {
    backgroundColor: '#131928',
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.4)',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 12,
  },
  dropIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  dropTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
    textAlign: 'center',
  },
  dropSub: {
    fontSize: 13,
    color: '#64748b',
  },
  fileInfo: {
    backgroundColor: '#1e2538',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  fileInfoText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  analyzeButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  viewButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
    marginBottom: 12,
  },
  viewButtonText: {
    color: '#7c3aed',
    fontSize: 15,
    fontWeight: '600',
  },
  pasteLabel: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  pasteInput: {
    backgroundColor: '#1e2538',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 20,
    minHeight: 200,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tipsCard: {
    backgroundColor: '#131928',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tipsTitle: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  tipItem: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 22,
  },
})
