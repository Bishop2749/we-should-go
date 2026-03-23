import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Location as LocationType, CATEGORIES, NEON_USER_ID } from '@/types'

export default function MapScreen() {
  const mapRef = useRef<MapView>(null)
  const [locations, setLocations] = useState<LocationType[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null)
  const { user } = useAuth()

  const [region, setRegion] = useState({
    latitude: 34.0522,
    longitude: -118.2437,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  })

  useEffect(() => {
    // Get current location
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(loc => {
          const newRegion = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }
          setRegion(newRegion)
          mapRef.current?.animateToRegion(newRegion, 500)
        })
      }
    })

    // Fetch locations
    supabase.from('locations').select('*').then(({ data }) => {
      if (data) setLocations(data)
    })
  }, [])

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color ?? '#6B7280'
  }

  const getCategoryEmoji = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.emoji ?? '📍'
  }

  const isNeon = (loc: LocationType) => loc.added_by === NEON_USER_ID

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {locations.map(loc => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            onPress={() => setSelectedLocation(loc)}
          >
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: isNeon(loc) ? '#F59E0B' : getCategoryColor(loc.category),
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2.5, borderColor: 'white',
              shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
              elevation: 5,
            }}>
              <Text style={{ fontSize: 17 }}>{getCategoryEmoji(loc.category)}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{
          marginHorizontal: 16, marginTop: 8,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
          flexDirection: 'row', alignItems: 'center',
          shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 }}>📍 We Should Go</Text>
          <Text style={{ fontSize: 13, color: '#6B7280' }}>{locations.filter(l => !isNeon(l)).length} spots</Text>
        </View>
      </SafeAreaView>

      {/* Recenter button */}
      <View style={{ position: 'absolute', bottom: 100, right: 16 }}>
        <TouchableOpacity
          onPress={async () => {
            const loc = await Location.getCurrentPositionAsync({})
            mapRef.current?.animateToRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 500)
          }}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: 'white',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
          }}
        >
          <Text style={{ fontSize: 18 }}>◎</Text>
        </TouchableOpacity>
      </View>

      {/* Simple location preview */}
      {selectedLocation && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: 20, paddingBottom: 40,
          shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
        }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
            {getCategoryEmoji(selectedLocation.category)} {selectedLocation.name}
          </Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>{selectedLocation.address}</Text>
          {selectedLocation.notes && (
            <Text style={{ fontSize: 14, color: '#374151' }}>{selectedLocation.notes}</Text>
          )}
          <TouchableOpacity
            onPress={() => setSelectedLocation(null)}
            style={{ position: 'absolute', top: 20, right: 20 }}
          >
            <Text style={{ fontSize: 20, color: '#9CA3AF' }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
