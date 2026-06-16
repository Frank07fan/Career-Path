import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../context/AppContext'

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

const CATEGORIES = [
  'All', 'Food & Drink', 'Transport', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Health', 'Travel', 'Income', 'Transfer', 'Other'
]

function fmt(n, currency = 'CAD') {
  try {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(Math.abs(n))
  } catch {
    return `$${Math.abs(n).toFixed(2)}`
  }
}

function TransactionRow({ tx, onDelete }) {
  const dotColor = CATEGORY_COLORS[tx.category] || '#94a3b8'

  return (
    <View style={styles.txRow}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
        <Text style={styles.txMeta}>{tx.category} · {tx.date}</Text>
      </View>
      <Text style={[styles.txAmount, tx.amount < 0 ? styles.expense : styles.income]}>
        {tx.amount < 0 ? '-' : '+'}{fmt(tx.amount)}
      </Text>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets()
  const { data, deleteTransaction } = useApp()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const currency = data.settings?.currency || 'CAD'

  const filtered = useMemo(() => {
    let list = data.transactions
    if (selectedCategory !== 'All') {
      list = list.filter(t => t.category === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.date.includes(q)
      )
    }
    return [...list].sort((a, b) => b.date.localeCompare(a.date))
  }, [data.transactions, search, selectedCategory])

  const expenseCount = filtered.filter(t => t.amount < 0).length
  const incomeCount = filtered.filter(t => t.amount > 0).length
  const totalExpenses = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalIncome = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)

  function handleDelete(tx) {
    const originalIdx = data.transactions.findIndex(t =>
      t.date === tx.date && t.description === tx.description && t.amount === tx.amount
    )
    if (originalIdx === -1) return

    Alert.alert(
      'Delete Transaction',
      `Remove "${tx.description}" from ${tx.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(originalIdx) }
      ]
    )
  }

  const renderItem = ({ item }) => (
    <TransactionRow tx={item} onDelete={() => handleDelete(item)} />
  )

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyText}>
        {data.transactions.length === 0
          ? 'No transactions yet. Import a statement!'
          : 'No transactions match your filters.'}
      </Text>
    </View>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Transactions</Text>
        <Text style={styles.countText}>{filtered.length} shown</Text>
      </View>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expenses ({expenseCount})</Text>
            <Text style={styles.summaryValueExpense}>{fmt(totalExpenses, currency)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income ({incomeCount})</Text>
            <Text style={styles.summaryValueIncome}>{fmt(totalIncome, currency)}</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={t => setSearch(t)}
          placeholder="Search transactions…"
          placeholderTextColor={COLORS.muted}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction list */}
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => `${item.date}-${item.description}-${item.amount}-${i}`}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  countText: {
    color: '#64748b',
    fontSize: 13,
  },
  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#131928',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValueExpense: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '700',
  },
  summaryValueIncome: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e2538',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#e2e8f0',
    fontSize: 15,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#131928',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  filterChipText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  txMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
  expense: {
    color: '#dc2626',
  },
  income: {
    color: '#059669',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(220,38,38,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
})
