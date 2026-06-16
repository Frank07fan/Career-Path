import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts'
import { useApp } from '../App'

const COLORS = ['#7c3aed','#2563eb','#0891b2','#059669','#d97706','#dc2626','#db2777','#6d28d9','#0284c7','#65a30d']

function fmt(n) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Math.abs(n))
}

export default function Dashboard() {
  const { data, setPage } = useApp()
  const txs = data.transactions

  const stats = useMemo(() => {
    const expenses = txs.filter(t => t.amount < 0)
    const income = txs.filter(t => t.amount > 0)
    const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
    const totalIncome = income.reduce((s, t) => s + t.amount, 0)

    // By category
    const byCategory = {}
    expenses.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount)
    })
    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)

    // By month
    const byMonth = {}
    txs.forEach(t => {
      const month = t.date.slice(0, 7)
      if (!byMonth[month]) byMonth[month] = { month, income: 0, expenses: 0 }
      if (t.amount > 0) byMonth[month].income += t.amount
      else byMonth[month].expenses += Math.abs(t.amount)
    })
    const monthlyData = Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        income: parseFloat(m.income.toFixed(2)),
        expenses: parseFloat(m.expenses.toFixed(2))
      }))

    // Recent
    const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

    return { totalExpenses, totalIncome, categoryData, monthlyData, recent, count: txs.length }
  }, [txs])

  if (txs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📂</div>
        <h2>No transactions yet</h2>
        <p>Upload a bank statement to get started</p>
        <button className="btn-primary" onClick={() => setPage('upload')}>Upload Statement</button>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>

      <div className="stat-grid">
        <div className="stat-card accent-purple">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{fmt(stats.totalExpenses)}</div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">{fmt(stats.totalIncome)}</div>
        </div>
        <div className="stat-card accent-blue">
          <div className="stat-label">Net</div>
          <div className="stat-value">{fmt(stats.totalIncome - stats.totalExpenses)}</div>
        </div>
        <div className="stat-card accent-cyan">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{stats.count}</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3 className="chart-title">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {stats.categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Monthly Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: '#1e1b2e', border: '1px solid #2d2a42', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="income" fill="#059669" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card recent-card">
        <h3 className="chart-title">Recent Transactions</h3>
        <div className="tx-list">
          {stats.recent.map((t, i) => (
            <div key={i} className="tx-row">
              <div className="tx-left">
                <div className="tx-desc">{t.description}</div>
                <div className="tx-meta">{t.date} · {t.category}</div>
              </div>
              <div className={`tx-amount ${t.amount < 0 ? 'expense' : 'income'}`}>
                {t.amount < 0 ? '-' : '+'}{fmt(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
