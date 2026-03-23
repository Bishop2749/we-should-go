import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState } from 'react-native'

const supabaseUrl = 'https://bawzdctzxcslmosixiss.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhd3pkY3R6eGNzbG1vc2l4aXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTk1MDgsImV4cCI6MjA4OTQ3NTUwOH0.zpb9f-1AOTPZwmBkl-Y4NmzlhcMV9w1HswHPMFKVIuA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh()
  else supabase.auth.stopAutoRefresh()
})
