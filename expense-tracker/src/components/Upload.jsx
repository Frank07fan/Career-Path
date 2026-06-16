import { useState, useRef } from 'react'
import { parsePDF, parseCSV, csvToText } from '../lib/fileParser'
import { parseStatement } from '../lib/claude'
import { useApp } from '../App'

export default function Upload() {
  const { data, addTransactions, setPage } = useApp()
  const [status, setStatus] = useState('idle') // idle | parsing | extracting | done | error
  const [message, setMessage] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  async function handleFile(file) {
    if (!file) return
    if (!data.settings.apiKey) {
      setStatus('error')
      setMessage('Please add your Claude API key in Settings first.')
      return
    }

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'csv', 'txt'].includes(ext)) {
      setStatus('error')
      setMessage('Unsupported file type. Please upload a PDF, CSV, or TXT file.')
      return
    }

    setStatus('parsing')
    setMessage(`Reading ${file.name}…`)
    setPreview(null)

    try {
      let text = ''
      if (ext === 'pdf') {
        text = await parsePDF(file)
      } else if (ext === 'csv') {
        const result = await parseCSV(file)
        text = csvToText(result)
      } else {
        text = await file.text()
      }

      setPreview(text.slice(0, 500))
      setStatus('extracting')
      setMessage('Sending to Claude AI for extraction…')

      const result = await parseStatement(text, data.settings.apiKey)
      addTransactions(result.transactions)

      setStatus('done')
      setMessage(`Successfully imported ${result.transactions.length} transaction(s)!`)
    } catch (err) {
      setStatus('error')
      setMessage(`Error: ${err.message}`)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div className="page">
      <h1 className="page-title">Upload Statement</h1>
      <p className="page-subtitle">Upload a bank statement (PDF, CSV, or TXT) and Claude AI will extract all transactions automatically.</p>

      <div
        className={`drop-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.csv,.txt"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
        <div className="drop-icon">📄</div>
        <div className="drop-title">Drop your statement here</div>
        <div className="drop-sub">or click to browse — PDF, CSV, TXT</div>
      </div>

      {status !== 'idle' && (
        <div className={`upload-status status-${status}`}>
          {status === 'parsing' && <span className="spinner" />}
          {status === 'extracting' && <span className="spinner" />}
          {status === 'done' && <span className="status-icon">✅</span>}
          {status === 'error' && <span className="status-icon">❌</span>}
          <span>{message}</span>
        </div>
      )}

      {preview && (
        <div className="preview-box">
          <div className="preview-label">Text preview (first 500 chars)</div>
          <pre className="preview-text">{preview}</pre>
        </div>
      )}

      {status === 'done' && (
        <button className="btn-primary" onClick={() => setPage('transactions')}>
          View Transactions →
        </button>
      )}

      <div className="upload-tips">
        <h3>Tips for best results</h3>
        <ul>
          <li>Use official PDF exports from your bank's online portal</li>
          <li>CSV files work best with columns: Date, Description, Amount</li>
          <li>Duplicate transactions are automatically filtered out</li>
          <li>Your statement text is only sent to Claude AI — it is never stored on any server</li>
        </ul>
      </div>
    </div>
  )
}
