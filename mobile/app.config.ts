import { ExpoConfig, ConfigContext } from 'expo/config'

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_MOBILE_KEY || ''

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'We Should Go',
  slug: 'we-should-go',
  scheme: 'weshouldgo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.weshouldgo.app',
    config: {
      googleMapsApiKey: GOOGLE_MAPS_KEY,
    },
    infoPlist: {
      NSHealthShareUsageDescription:
        'Bishop uses your health records to help you track medications, appointments, and lab results.',
      NSHealthUpdateUsageDescription:
        'Bishop may write health data to help track your wellness.',
    },
    entitlements: {
      'com.apple.developer.healthkit': true,
      'com.apple.developer.healthkit.access': ['health-records'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.weshouldgo.app',
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_KEY,
      },
    },
  },
  web: { bundler: 'metro' },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'We Should Go uses your location to show you nearby places.',
      },
    ],
    ['@kingstinct/react-native-healthkit', {}],
  ],
})
