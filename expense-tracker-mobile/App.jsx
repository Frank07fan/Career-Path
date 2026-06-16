import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'

import { AppProvider } from './src/context/AppContext'
import DashboardScreen from './src/screens/DashboardScreen'
import UploadScreen from './src/screens/UploadScreen'
import TransactionsScreen from './src/screens/TransactionsScreen'
import SettingsScreen from './src/screens/SettingsScreen'

const Tab = createBottomTabNavigator()

const COLORS = {
  bg: '#0a0d16',
  card: '#131928',
  border: 'rgba(255,255,255,0.08)',
  accent: '#7c3aed',
  text: '#e2e8f0',
  muted: '#64748b',
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: {
                backgroundColor: COLORS.card,
                borderTopColor: COLORS.border,
                borderTopWidth: 1,
                height: 84,
                paddingBottom: 28,
                paddingTop: 8,
              },
              tabBarActiveTintColor: COLORS.accent,
              tabBarInactiveTintColor: COLORS.muted,
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
              },
              tabBarIcon: ({ focused, color, size }) => {
                let iconName
                if (route.name === 'Dashboard') {
                  iconName = focused ? 'stats-chart' : 'stats-chart-outline'
                } else if (route.name === 'Import') {
                  iconName = focused ? 'cloud-upload' : 'cloud-upload-outline'
                } else if (route.name === 'Transactions') {
                  iconName = focused ? 'list' : 'list-outline'
                } else if (route.name === 'Settings') {
                  iconName = focused ? 'settings' : 'settings-outline'
                }
                return <Ionicons name={iconName} size={size} color={color} />
              },
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Import" component={UploadScreen} />
            <Tab.Screen name="Transactions" component={TransactionsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  )
}
