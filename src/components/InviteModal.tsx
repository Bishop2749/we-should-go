'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onClose: () => void
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

export default function InviteModal({ onClose }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Generate invite on mount
  useEffect(() => {
    async function generate() {
      try {
        const res = await fetch('/api/invite/create', { method: 'POST' })
        if (!res.ok) throw new Error('Failed')
        const { token } = (await res.json()) as { token: string }
        setInviteUrl(`${window.location.origin}/invite/${token}`)
        setLoadState('ready')
      } catch {
        setLoadState('error')
      }
    }
    generate()
  }, [])

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers / non-https
      const input = document.createElement('input')
      input.value = inviteUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleEmail = () => {
    const subject = encodeURIComponent('Join me on We Should Go')
    const body = encodeURIComponent(
      `Hey! I want to share places with you on We Should Go — a map where friends save spots worth visiting together.\n\nJoin here: ${inviteUrl}`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleSms = () => {
    const body = encodeURIComponent(`Hey! Join me on We Should Go: ${inviteUrl}`)
    window.open(`sms:?body=${body}`)
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-600"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 text-base">Invite a friend</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Link field */}
          <div>
            {loadState === 'loading' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="text-sm text-gray-400">Generating your invite link…</span>
              </div>
            )}

            {loadState === 'error' && (
              <div className="px-4 py-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-600">
                Couldn&apos;t generate a link. Please try again.
              </div>
            )}

            {loadState === 'ready' && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                <span className="flex-1 text-xs text-gray-600 font-mono truncate">{inviteUrl}</span>
              </div>
            )}
          </div>

          {/* Share buttons */}
          {loadState === 'ready' && (
            <div className="grid grid-cols-3 gap-2">
              {/* Copy */}
              <button
                onClick={handleCopy}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all text-xs font-medium ${
                  copied
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
                {copied ? 'Copied!' : 'Copy link'}
              </button>

              {/* Email */}
              <button
                onClick={handleEmail}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email
              </button>

              {/* Text/SMS */}
              <button
                onClick={handleSms}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Text
              </button>
            </div>
          )}

          {/* Expiry note */}
          {loadState === 'ready' && (
            <p className="text-xs text-gray-400 text-center">
              ⏳ Link expires in 7 days
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
