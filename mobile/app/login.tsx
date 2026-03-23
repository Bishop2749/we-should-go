import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { makeRedirectUri } from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export default function Login() {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const redirectUrl = makeRedirectUri({ scheme: 'weshouldgo', path: 'auth/callback' })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      })
      if (error || !data?.url) throw error
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const fragment = new URLSearchParams(url.hash.slice(1))
        const access_token = fragment.get('access_token')
        const refresh_token = fragment.get('refresh_token')
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-white items-center justify-center px-8">
      <Text className="text-5xl mb-6">📍</Text>
      <Text className="text-3xl font-bold text-gray-900 mb-2">We Should Go</Text>
      <Text className="text-gray-500 text-center text-base mb-16 leading-relaxed">
        Save spots. Plan things.{'\n'}Actually go.
      </Text>
      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-emerald-500 rounded-2xl py-4 items-center justify-center shadow-sm active:bg-emerald-600"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-base">Continue with Google</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}
