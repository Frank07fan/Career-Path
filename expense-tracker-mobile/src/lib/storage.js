import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'expense_ai_v1'

const DEFAULT_DATA = {
  transactions: [],
  settings: { apiKey: '', currency: 'CAD' }
}

export async function loadData() {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : DEFAULT_DATA
  } catch {
    return DEFAULT_DATA
  }
}

export async function saveData(data) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data))
  } catch (err) {
    console.error('Failed to save data:', err)
  }
}

export async function exportDataAsJSON() {
  const data = await loadData()
  return JSON.stringify(data, null, 2)
}

export async function clearStoredData() {
  try {
    await AsyncStorage.removeItem(KEY)
  } catch (err) {
    console.error('Failed to clear data:', err)
  }
}
