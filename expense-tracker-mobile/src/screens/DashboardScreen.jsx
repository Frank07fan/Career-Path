import React, { useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PieChart, BarChart } from 'react-native-gifted-charts'
import { useNavigation } from '@react-navigation/native'
import { useApp } from '../context/AppContext'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const COLORS = {
  bg: '#0a0d16',
  card: '#131928',
  border: 'rgba(255,255,255,0.08)',
  accent: '#7c3aed',
  success: '#059669',
  danger: '#dc2626',
  text: '#e2e8f0',
  muted: '#64748b',
}

const CATEGORY_COLORS = {
  'Food & Drink': '#f97316',
  'Transport': '#3b82f6',
  'Shopping': '#a855f7',
  'Entertainment': '#ec4899',
  'Bills & Utilities': '#ef4444',
  'Health': '#22c55e',
  'Travel': '#06b6d4',
  'Income': '#10b981',
  'Transfer': '#64748b',
  'Other': '#94a3b8',
}

const CATEGORY_EMOJIS = {
  'Food & Drink': '🍔',
  'Transport': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Bills & Utilities': '💡',
  'Health': '💊',
  'Travel': '✈️',
  'Income': '💰',
  'Transfer': '🔄',
  'Other': '📦',
}

function fmt(n, currency = 'CAD') {
  try {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(Math.abs(n))
  } catch {
    return `$${Math.abs(n).toFixed(2)}`
  }
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { data, loading } = useApp()
  const txs = data.transactions
  const currency = data.settings?.currency || 'CAD'

  const stats = useMemo(() => {
    const expenses = txs.filter(t => t.amount < 0)
    const income = txs.filter(t => t.amount > 0)
    const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
    const totalIncome = income.reduce((s, t) => s + t.amount, 0)
    const net = totalIncome - totalExpenses

    // By category (expenses only)
    const byCategory = {}
    expenses.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount)
    })
    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({
        value: parseFloat(value.toFixed(2)),
        color: CATEGORY_COLORS[name] || '#94a3b8',
        text: name,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Limit for legibility

    // By month (last 6 months)
    const byMonth = {}
    txs.forEach(t => {
      const month = t.date.slice(0, 7)
      if (!byMonth[month]) byMonth[month] = { month, income: 0, expenses: 0 }
      if (t.amount > 0) byMonth[month].income += t.amount
      else byMonth[month].expenses += Math.abs(t.amount)
    })
    const allMonths = Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
    const monthlyData = allMonths.slice(-6).map(m => ({
      value: parseFloat(m.expenses.toFixed(2)),
      label: m.month.slice(5), // MM
      frontColor: COLORS.accent,
    }))

    // Recent transactions
    const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

    return { totalExpenses, totalIncome, net, categoryData, monthlyData, recent, count: txs.length }
  }, [txs])

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    )
  }

  if (txs.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.emptyIcon}>📂</Text>
        <Text style={styles.emptyTitle}>No transactions yet</Text>
        <Text style={styles.emptySubtitle}>Import a bank statement to get started</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Import')}
        >
          <Text style={styles.primaryButtonText}>Import Statement</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ExpenseAI</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{stats.count} transactions</Text>
        </View>
      </View>

      {/* Stat cards — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statRow}
      >
        <StatCard label="Total Spent" value={fmt(stats.totalExpenses, currency)} color={COLORS.danger} />
        <StatCard label="Total Income" value={fmt(stats.totalIncome, currency)} color={COLORS.success} />
        <StatCard label="Net Balance" value={fmt(stats.net, currency)} color={COLORS.accent} />
        <StatCard label="Transactions" value={String(stats.count)} color='#3b82f6' />
      </ScrollView>

      {/* Spending by Category */}
      {stats.categoryData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.chartCenter}>
            <PieChart
              data={stats.categoryData}
              donut
              radius={90}
              innerRadius={55}
              centerLabelComponent={() => (
                <View style={styles.pieCenter}>
                  <Text style={styles.pieCenterLabel}>Expenses</Text>
                  <Text style={styles.pieCenterValue}>{fmt(stats.totalExpenses, currency)}</Text>
                </View>
              )}
            />
          </View>
          {/* Legend */}
          <View style={styles.legend}>
            {stats.categoryData.map((item, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText} numberOfLines={1}>{item.text}</Text>
                <Text style={styles.legendValue}>{fmt(item.value, currency)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Monthly Trend */}
      {stats.monthlyData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Monthly Spending</Text>
          <BarChart
            data={stats.monthlyData}
            width={SCREEN_WIDTH - 80}
            height={180}
            barWidth={28}
            spacing={12}
            roundedTop
            hideRules
            xAxisColor={COLORS.border}
            yAxisColor={COLORS.border}
            yAxisTextStyle={{ color: COLORS.muted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: COLORS.muted, fontSize: 11 }}
            noOfSections={4}
            barBorderRadius={4}
            isAnimated
          />
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {stats.recent.map((t, i) => (
          <View key={i} style={[styles.txRow, i < stats.recent.length - 1 && styles.txRowBorder]}>
            <View style={[styles.txIconWrap, { backgroundColor: (CATEGORY_COLORS[t.category] || '#94a3b8') + '22' }]}>
              <Text style={styles.txEmoji}>{CATEGORY_EMOJIS[t.category] || '📦'}</Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txDesc} numberOfLines={1}>{t.description}</Text>
              <Text style={styles.txMeta}>{t.date} · {t.category}</Text>
            </View>
            <Text style={[styles.txAmount, t.amount < 0 ? styles.expense : styles.income]}>
              {t.amount < 0 ? '-' : '+'}{fmt(t.amount, currency)}
            </Text>
          </View>
        ))}
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Transactions')}
        >
          <Text style={styles.viewAllText}>View All Transactions →</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerBadgeText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  statRow: {
    paddingBottom: 16,
    gap: 10,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    minWidth: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  chartCenter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  pieCenterValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
  },
  legendValue: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txEmoji: {
    fontSize: 18,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  txMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  expense: {
    color: COLORS.danger,
  },
  income: {
    color: COLORS.success,
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewAllText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
})
