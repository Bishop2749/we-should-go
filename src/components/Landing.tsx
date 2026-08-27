import Link from 'next/link'

const features = [
  {
    icon: '📍',
    title: 'One shared map',
    body: 'Everyone drops pins on the same map. Restaurants, bars, shows, hikes — color-coded by category, searchable through Google Places.',
  },
  {
    icon: '🔥',
    title: 'React and commit',
    body: 'Mark places "want to go" or "been here". React with 🔥 ✅ 💯. The badges land on the pin itself, so the map shows what the group actually cares about.',
  },
  {
    icon: '📅',
    title: 'Turn a pin into a plan',
    body: 'Promote any place to a real event with a date, its own page, and RSVP tracking. The calendar view shows everything coming up.',
  },
  {
    icon: '✉️',
    title: 'Invite your crew',
    body: 'Single-use invite links that expire in 7 days. Share by link, email, or SMS — friendship is created automatically on first sign-in.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-lg mb-6">
          <span className="text-3xl">📍</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
          We Should Go
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          You and your friends say it constantly and never do anything about it.
          This is a shared map for the places you keep meaning to go — so they
          turn into actual plans.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/demo"
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold shadow-sm transition-colors"
          >
            Explore the demo map
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold border border-gray-200 dark:border-gray-700 shadow-sm transition-colors"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
          The demo is read-only and needs no account.
        </p>
      </section>

      {/* Screenshot */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/screenshots/map.jpg"
            alt="The We Should Go map, showing category-colored pins across Los Angeles"
            className="w-full block"
          />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row gap-3 items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p>Built with Next.js, Supabase, and the Google Maps platform.</p>
          <a
            href="https://github.com/Bishop2749/we-should-go"
            className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors font-medium"
          >
            Source on GitHub →
          </a>
        </div>
      </footer>
    </div>
  )
}
