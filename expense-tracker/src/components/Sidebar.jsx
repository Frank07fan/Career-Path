import { useApp } from '../App'
import { exportData } from '../lib/storage'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'upload', label: 'Upload', icon: '📤' },
  { id: 'transactions', label: 'Transactions', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ page, setPage }) {
  const { data } = useApp()
  const count = data.transactions.length

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">💳</span>
        <span className="logo-text">ExpenseAI</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item${page === item.id ? ' active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.id === 'transactions' && count > 0 && (
              <span className="nav-badge">{count}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-ghost" onClick={exportData}>
          ⬇ Export
        </button>
      </div>
    </aside>
  )
}
