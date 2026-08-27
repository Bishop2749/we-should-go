import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Landing from '@/components/Landing'

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Signed-in users go straight to their map; everyone else gets the landing page.
  if (user) {
    redirect('/map')
  }

  return <Landing />
}
