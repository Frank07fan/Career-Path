import { useState } from 'react'
import { useApp } from '../App'
import { clearData } from '../lib/storage'

export default function Settings() {
  const { data, updateSettings, clearAll } = useApp()
  const [apiKey, setApiKey] = useState(data.settings.apiKey || '')
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    updateSettings({ apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClear() {
    if (window.confirm('Delete ALL transactions? This cannot be undone.')) {
      clearAll()
      clearData()
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>

      <form className="settings-form" onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Claude API Key</label>
          <div className="input-row">
            <input
              className="form-input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-…"
              autoComplete="off"
            />
            <button type="button" className="btn-ghost icon-btn" onClick={() => setShowKey(v => !v)}>
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <div className="form-hint">
            Your API key is stored only in your browser's localStorage and is never sent to any server other than api.anthropic.com.
          </div>
        </div>

        <button className="btn-primary" type="submit">
          {saved ? '✅ Saved!' : 'Save Settings'}
        </button>
      </form>

      <div className="settings-section">
        <h2 className="section-title">Data</h2>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Transaction count</div>
            <div className="settings-row-sub">{data.transactions.length} transactions stored locally</div>
          </div>
        </div>
        <button className="btn-danger" onClick={handleClear}>
          🗑 Clear All Transactions
        </button>
      </div>

      <div className="settings-section">
        <h2 className="section-title">About</h2>
        <p className="about-text">
          ExpenseAI parses your bank statements locally using Claude AI. Your financial data never leaves your browser — only the raw statement text is sent to Claude for transaction extraction, and the parsed results are saved to your browser's localStorage.
        </p>
        <p className="about-text">
          Built with React, Vite, Recharts, and the Anthropic SDK.
        </p>
      </div>
    </div>
  )
}
