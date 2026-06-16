import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../context/AppContext'
import { exportDataAsJSON, clearStoredData } from '../lib/storage'

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

const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'AUD', 'JPY']

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { data, updateSettings, clearAll } = useApp()

  const [apiKey, setApiKey] = useState(data.settings?.apiKey || '')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const currency = data.settings?.currency || 'CAD'
  const currencyIdx = CURRENCIES.indexOf(currency)

  function handleSaveApiKey() {
    updateSettings({ apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function cycleCurrency() {
    const nextIdx = (currencyIdx + 1) % CURRENCIES.length
    updateSettings({ currency: CURRENCIES[nextIdx] })
  }

  async function handleExport() {
    try {
      const json = await exportDataAsJSON()
      const preview = json.slice(0, 1000)
      Alert.alert(
        'Export Data (JSON)',
        preview + (json.length > 1000 ? '\n…(truncated)' : ''),
        [{ text: 'OK' }]
      )
    } catch (err) {
      Alert.alert('Export failed', err.message)
    }
  }

  function handleClearAll() {
    Alert.alert(
      'Clear All Transactions',
      `This will permanently delete all ${data.transactions.length} transactions. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            clearAll()
            clearStoredData()
          }
        }
      ]
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Settings</Text>

        {/* API Key Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claude API Key</Text>
          <Text style={styles.sectionDesc}>
            Get your API key from console.anthropic.com. It is stored only on your device.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-ant-…"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setShowKey(v => !v)}
            >
              <Text style={styles.toggleBtnText}>{showKey ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, saved && styles.savedBtn]}
            onPress={handleSaveApiKey}
          >
            <Text style={styles.primaryBtnText}>{saved ? '✅ Saved!' : 'Save API Key'}</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Your API key is stored locally on this device and is only sent to api.anthropic.com when analyzing a statement.
          </Text>
        </View>

        {/* Currency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <Text style={styles.sectionDesc}>
            Used for formatting amounts throughout the app.
          </Text>

          <View style={styles.currencyRow}>
            <View style={styles.currencyDisplay}>
              <Text style={styles.currencyText}>{currency}</Text>
            </View>
            <TouchableOpacity style={styles.cycleCurrencyBtn} onPress={cycleCurrency}>
              <Text style={styles.cycleCurrencyText}>Change →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.currencyOptions}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
                onPress={() => updateSettings({ currency: c })}
              >
                <Text style={[styles.currencyChipText, currency === c && styles.currencyChipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <View style={styles.dataRow}>
            <View>
              <Text style={styles.dataRowLabel}>Transactions stored</Text>
              <Text style={styles.dataRowSub}>{data.transactions.length} transactions on this device</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Text style={styles.exportBtnText}>Export as JSON</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerBtn, data.transactions.length === 0 && styles.dangerBtnDisabled]}
            onPress={handleClearAll}
            disabled={data.transactions.length === 0}
          >
            <Text style={styles.dangerBtnText}>🗑 Clear All Transactions</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            ExpenseAI parses your bank statements using Claude AI. Your financial data never leaves
            your device — only the raw statement text is sent to Claude for transaction extraction.
            Parsed results are stored locally on your iPhone using AsyncStorage.
          </Text>
          <Text style={styles.aboutText}>
            Built with React Native (Expo), @react-navigation, react-native-gifted-charts, and the Anthropic SDK.
          </Text>
          <View style={styles.versionRow}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
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
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#131928',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e2538',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#e2e8f0',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  toggleBtnText: {
    fontSize: 18,
  },
  primaryBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  savedBtn: {
    backgroundColor: '#059669',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  currencyDisplay: {
    backgroundColor: '#1e2538',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  currencyText: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  cycleCurrencyBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  cycleCurrencyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  currencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e2538',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  currencyChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  currencyChipText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  currencyChipTextActive: {
    color: '#fff',
  },
  dataRow: {
    paddingVertical: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  dataRowLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  dataRowSub: {
    color: '#64748b',
    fontSize: 12,
  },
  exportBtn: {
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.5)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  exportBtnText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerBtn: {
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.4)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerBtnDisabled: {
    opacity: 0.4,
  },
  dangerBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  versionRow: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  versionText: {
    color: '#64748b',
    fontSize: 12,
  },
})
