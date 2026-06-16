const KEY = 'expense_tracker_v1'

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : { transactions: [], settings: { apiKey: '', currency: 'CAD' } }
  } catch {
    return { transactions: [], settings: { apiKey: '', currency: 'CAD' } }
  }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function exportData() {
  const data = loadData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expenses-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function clearData() {
  localStorage.removeItem(KEY)
}
