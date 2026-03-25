import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useHealthData, type QuantityStat } from '@/hooks/useHealthData'

function StatCard({ stat }: { stat: QuantityStat }) {
  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 2 }}>{stat.label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>{stat.value}</Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{stat.unit}</Text>
        </View>
      </View>
      {stat.date && (
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{stat.date}</Text>
      )}
    </View>
  )
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
      }}
    >
      {children}
    </View>
  )
}

export default function HealthScreen() {
  const { stats, loading, authorized, error, reload } = useHealthData()

  if (Platform.OS !== 'ios') {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#F9FAFB',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🏥</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
          iOS Only
        </Text>
        <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
          Health data is available on iPhone via Apple Health.
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>🏥 Health</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
            Synced from Apple Health
          </Text>
        </View>
        {authorized && !loading && (
          <TouchableOpacity
            onPress={reload}
            style={{
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>Refresh</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading health data...</Text>
        </View>
      )}

      {!loading && !authorized && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#111827',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Health Access Needed
          </Text>
          <Text
            style={{ color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}
          >
            Connect Apple Health to see your heart rate, steps, weight, and more.
          </Text>
          <TouchableOpacity
            onPress={reload}
            style={{
              backgroundColor: '#10B981',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Connect Health</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && authorized && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {error && (
            <View
              style={{
                backgroundColor: '#FEE2E2',
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: '#DC2626', fontSize: 13 }}>⚠️ {error}</Text>
            </View>
          )}

          {/* Clinical records notice */}
          <InfoCard>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 4 }}>
              📋 Epic / MyChart Records
            </Text>
            <Text style={{ fontSize: 12, color: '#78350F', lineHeight: 18 }}>
              Clinical records (medications, lab results, conditions) from Epic require Apple's
              special Health Records entitlement and app review approval. This will be added in a
              future update once approved.
            </Text>
          </InfoCard>

          {/* Stats */}
          {stats.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 32 }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>📊</Text>
              <Text style={{ color: '#9CA3AF', textAlign: 'center', fontSize: 14 }}>
                No health data found in the last 7 days.{'\n'}Make sure Apple Health is recording
                data.
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#6B7280',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Last 7 Days
              </Text>
              {stats.map((stat, i) => (
                <StatCard key={i} stat={stat} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
