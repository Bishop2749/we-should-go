import { useState, useEffect } from 'react'
import { Platform } from 'react-native'

// NOTE: Clinical Records (medications, conditions, lab results from Epic/MyChart)
// were removed from @kingstinct/react-native-healthkit in v4+.
// They require a special Apple entitlement (com.apple.developer.healthkit.access: health-records)
// and App Store review approval. The library's v3.x / "including-clinical-records" branch
// supported them but is incompatible with React Native 0.83+.
//
// This hook reads quantity/category data available in v13.x:
// - Heart rate, resting heart rate
// - Step counts (last 7 days)
// - Body mass (weight)
// - Blood glucose
// - Active energy burned

export interface QuantityStat {
  label: string
  value: string
  unit: string
  date?: string
}

export function useHealthData() {
  const [stats, setStats] = useState<QuantityStat[]>([])
  const [loading, setLoading] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    loadHealthData()
  }, [])

  async function loadHealthData() {
    try {
      setLoading(true)
      setError(null)

      // Dynamic import — avoids Android crash since HealthKit is iOS-only
      const HK = await import('@kingstinct/react-native-healthkit')

      const readTypes = [
        'HKQuantityTypeIdentifierHeartRate',
        'HKQuantityTypeIdentifierRestingHeartRate',
        'HKQuantityTypeIdentifierStepCount',
        'HKQuantityTypeIdentifierBodyMass',
        'HKQuantityTypeIdentifierBloodGlucose',
        'HKQuantityTypeIdentifierActiveEnergyBurned',
      ] as const

      const granted = await HK.requestAuthorization({ toRead: readTypes })
      setAuthorized(granted)

      if (!granted) return

      const results: QuantityStat[] = []
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Heart rate — most recent reading
      try {
        const hrSamples = await HK.queryQuantitySamples(
          'HKQuantityTypeIdentifierHeartRate',
          {
            limit: 1,
            unit: 'count/min',
            filter: { date: { startDate: sevenDaysAgo, endDate: now } },
          }
        )
        if (hrSamples.length > 0) {
          const s = hrSamples[0]
          results.push({
            label: '❤️ Heart Rate',
            value: Math.round(s.quantity).toString(),
            unit: 'bpm',
            date: s.startDate ? new Date(s.startDate).toLocaleDateString() : undefined,
          })
        }
      } catch (_) {}

      // Resting heart rate — most recent
      try {
        const rhrSamples = await HK.queryQuantitySamples(
          'HKQuantityTypeIdentifierRestingHeartRate',
          {
            limit: 1,
            unit: 'count/min',
            filter: { date: { startDate: sevenDaysAgo, endDate: now } },
          }
        )
        if (rhrSamples.length > 0) {
          const s = rhrSamples[0]
          results.push({
            label: '💤 Resting Heart Rate',
            value: Math.round(s.quantity).toString(),
            unit: 'bpm',
            date: s.startDate ? new Date(s.startDate).toLocaleDateString() : undefined,
          })
        }
      } catch (_) {}

      // Steps — sum over 7 days
      try {
        const stepSamples = await HK.queryQuantitySamples(
          'HKQuantityTypeIdentifierStepCount',
          {
            limit: -1,
            unit: 'count',
            filter: { date: { startDate: sevenDaysAgo, endDate: now } },
          }
        )
        if (stepSamples.length > 0) {
          const total = stepSamples.reduce((sum, s) => sum + s.quantity, 0)
          results.push({
            label: '🚶 Steps (7 days)',
            value: Math.round(total).toLocaleString(),
            unit: 'steps',
          })
        }
      } catch (_) {}

      // Body mass — most recent
      try {
        const weightSamples = await HK.queryQuantitySamples(
          'HKQuantityTypeIdentifierBodyMass',
          {
            limit: 1,
            unit: 'lb',
            filter: { date: { startDate: sevenDaysAgo, endDate: now } },
          }
        )
        if (weightSamples.length > 0) {
          const s = weightSamples[0]
          results.push({
            label: '⚖️ Weight',
            value: s.quantity.toFixed(1),
            unit: 'lbs',
            date: s.startDate ? new Date(s.startDate).toLocaleDateString() : undefined,
          })
        }
      } catch (_) {}

      // Blood glucose — most recent
      try {
        const bgSamples = await HK.queryQuantitySamples(
          'HKQuantityTypeIdentifierBloodGlucose',
          {
            limit: 1,
            unit: 'mg/dL',
            filter: { date: { startDate: sevenDaysAgo, endDate: now } },
          }
        )
        if (bgSamples.length > 0) {
          const s = bgSamples[0]
          results.push({
            label: '🩸 Blood Glucose',
            value: s.quantity.toFixed(0),
            unit: 'mg/dL',
            date: s.startDate ? new Date(s.startDate).toLocaleDateString() : undefined,
          })
        }
      } catch (_) {}

      // Active energy — sum over 7 days
      try {
        const energySamples = await HK.queryQuantitySamples(
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          {
            limit: -1,
            unit: 'kcal',
            filter: { date: { startDate: sevenDaysAgo, endDate: now } },
          }
        )
        if (energySamples.length > 0) {
          const total = energySamples.reduce((sum, s) => sum + s.quantity, 0)
          results.push({
            label: '🔥 Active Energy (7 days)',
            value: Math.round(total).toLocaleString(),
            unit: 'kcal',
          })
        }
      } catch (_) {}

      setStats(results)
    } catch (e: any) {
      setError(e.message ?? 'Unknown HealthKit error')
      console.error('HealthKit error:', e)
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading, authorized, error, reload: loadHealthData }
}
