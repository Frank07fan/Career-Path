import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loadData, saveData } from '../lib/storage'

const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

const DEFAULT_DATA = {
  transactions: [],
  settings: { apiKey: '', currency: 'CAD' }
}

export function AppProvider({ children }) {
  const [data, setData] = useState(DEFAULT_DATA)
  const [loading, setLoading] = useState(true)

  // Load from AsyncStorage on mount
  useEffect(() => {
    loadData().then(saved => {
      setData(saved)
      setLoading(false)
    })
  }, [])

  // Persist to AsyncStorage whenever data changes (skip on initial load)
  useEffect(() => {
    if (!loading) {
      saveData(data)
    }
  }, [data, loading])

  const addTransactions = useCallback((newTxns) => {
    setData(prev => {
      const existing = new Set(
        prev.transactions.map(t => `${t.date}|${t.description}|${t.amount}`)
      )
      const unique = newTxns.filter(
        t => !existing.has(`${t.date}|${t.description}|${t.amount}`)
      )
      return { ...prev, transactions: [...prev.transactions, ...unique] }
    })
  }, [])

  const deleteTransaction = useCallback((idx) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== idx)
    }))
  }, [])

  const updateSettings = useCallback((newSettings) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }))
  }, [])

  const clearAll = useCallback(() => {
    setData(prev => ({ transactions: [], settings: prev.settings }))
  }, [])

  return (
    <AppContext.Provider value={{
      data,
      loading,
      addTransactions,
      deleteTransaction,
      updateSettings,
      clearAll
    }}>
      {children}
    </AppContext.Provider>
  )
}
