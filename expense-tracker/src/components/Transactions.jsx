import { useState, useMemo } from 'react'
import { useApp } from '../App'

const CATEGORIES = [
  'All', 'Food & Drink', 'Transport', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Health', 'Travel', 'Income', 'Transfer', 'Other'
]

function fmt(n) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Math.abs(n))
}

export default function Transactions() {
  const { data, deleteTransaction } = useApp()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('date-desc')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  const filtered = useMemo(() => {
    let list = data.transactions
    if (category !== 'All') list = list.filter(t => t.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    }
    list = [...list].sort((a, b) => {
      if (sort === 'date-desc') return b.date.localeCompare(a.date)
      if (sort === 'date-asc') return a.date.localeCompare(b.date)
      if (sort === 'amount-desc') return Math.abs(b.amount) - Math.abs(a.amount)
      if (sort === 'amount-asc') return Math.abs(a.amount) - Math.abs(b.amount)
      return 0
    })
    return list
  }, [data.transactions, search, category, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Map original index for deletion
  function getOriginalIndex(tx) {
    return data.transactions.findIndex(t =>
      t.date === tx.date && t.description === tx.description && t.amount === tx.amount
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Transactions</h1>

      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder="Search…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          className="filter-select"
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1) }}
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select
          className="filter-select"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="date-desc">Date (newest)</option>
          <option value="date-asc">Date (oldest)</option>
          <option value="amount-desc">Amount (largest)</option>
          <option value="amount-asc">Amount (smallest)</option>
        </select>
      </div>

      <div className="table-wrap">
        {visible.length === 0 ? (
          <div className="empty-state small">
            <div>No transactions match your filters</div>
          </div>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((tx, i) => (
                <tr key={i}>
                  <td className="tx-date">{tx.date}</td>
                  <td className="tx-desc-cell">{tx.description}</td>
                  <td><span className="category-badge">{tx.category}</span></td>
                  <td className={`tx-amount-cell ${tx.amount < 0 ? 'expense' : 'income'}`}>
                    {tx.amount < 0 ? '-' : '+'}{fmt(tx.amount)}
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => deleteTransaction(getOriginalIndex(tx))}
                      title="Delete"
                    >×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button className="btn-ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <div className="tx-summary">
        Showing {visible.length} of {filtered.length} transactions
      </div>
    </div>
  )
}
