import { Text } from 'react-native'
import { Tabs } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import '../global.css'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { borderTopColor: '#F3F4F6' },
          tabBarActiveTintColor: '#10B981',
          tabBarInactiveTintColor: '#9CA3AF',
        }}
      >
        {/* Hidden screens — not shown in tab bar */}
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="login" options={{ href: null }} />

        {/* Visible tabs */}
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarLabel: 'Map',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🗺️</Text>,
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: 'Health',
            tabBarLabel: 'Health',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏥</Text>,
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  )
}
