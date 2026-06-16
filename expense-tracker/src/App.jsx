import { useState, useEffect, createContext, useContext } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Upload from './components/Upload'
import Transactions from './components/Transactions'
import Settings from './components/Settings'
import { loadData, saveData } from './lib/storage'

export const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  function addTransactions(newTransactions) {
    setData(prev => {
      const existing = new Set(prev.transactions.map(t => `${t.date}|${t.description}|${t.amount}`))
      const unique = newTransactions.filter(t => !existing.has(`${t.date}|${t.description}|${t.amount}`))
      return { ...prev, transactions: [...prev.transactions, ...unique] }
    })
  }

  function updateSettings(settings) {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }))
  }

  function deleteTransaction(idx) {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== idx)
    }))
  }

  function clearAll() {
    setData({ transactions: [], settings: data.settings })
  }

  return (
    <AppContext.Provider value={{ data, addTransactions, updateSettings, deleteTransaction, clearAll, setPage }}>
      <div className="app-shell">
        <Sidebar page={page} setPage={setPage} />
        <main className="main-content">
          {page === 'dashboard' && <Dashboard />}
          {page === 'upload' && <Upload />}
          {page === 'transactions' && <Transactions />}
          {page === 'settings' && <Settings />}
        </main>
      </div>
    </AppContext.Provider>
  )
}
