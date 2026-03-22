'use client'

import { useState } from 'react'

export interface FilterState {
  neighborhoods: string[]
  categories: string[]
  show: 'all' | 'neon' | 'user'
}

interface FilterPanelProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClose: () => void
}

const NEIGHBORHOODS = ['Koreatown', 'Downtown', 'Hollywood', 'NoHo', 'Miracle Mile']

const CATEGORIES = [
  { value: 'restaurant', label: '🍽️ Food' },
  { value: 'bar', label: '🍺 Bars' },
  { value: 'activity', label: '🎯 Activities' },
  { value: 'event', label: '🎉 Events' },
]

export default function FilterPanel({ filters, onChange, onClose }: FilterPanelProps) {
  const [local, setLocal] = useState<FilterState>({ ...filters })

  const isActive =
    local.neighborhoods.length > 0 ||
    local.categories.length > 0 ||
    local.show !== 'all'

  function toggleNeighborhood(n: string) {
    setLocal(prev => ({
      ...prev,
      neighborhoods: prev.neighborhoods.includes(n)
        ? prev.neighborhoods.filter(x => x !== n)
        : [...prev.neighborhoods, n],
    }))
  }

  function toggleCategory(c: string) {
    setLocal(prev => ({
      ...prev,
      categories: prev.categories.includes(c)
        ? prev.categories.filter(x => x !== c)
        : [...prev.categories, c],
    }))
  }

  function clearAll() {
    setLocal({ neighborhoods: [], categories: [], show: 'all' })
  }

  function apply() {
    onChange(local)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Filters</h2>
            <div className="flex items-center gap-2">
              {isActive && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Section 1: Neighborhoods */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Neighborhoods</h3>
                {local.neighborhoods.length === 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">All neighborhoods</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {NEIGHBORHOODS.map(n => (
                  <button
                    key={n}
                    onClick={() => toggleNeighborhood(n)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      local.neighborhoods.includes(n)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Categories */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Categories</h3>
                {local.categories.length === 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">All categories</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => toggleCategory(c.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      local.categories.includes(c.value)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Show */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Show</h3>
              <div className="space-y-2">
                {([
                  { value: 'all', label: 'Everything' },
                  { value: 'neon', label: "Neon's picks only" },
                  { value: 'user', label: 'My saves only' },
                ] as { value: FilterState['show']; label: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setLocal(prev => ({ ...prev, show: opt.value }))}
                    className="flex items-center gap-2.5 w-full text-left"
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      local.show === opt.value
                        ? 'border-emerald-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {local.show === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      local.show === opt.value
                        ? 'text-gray-900 dark:text-white font-medium'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Apply button */}
          <div className="px-5 pb-6 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={apply}
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white w-full py-3 rounded-2xl font-semibold text-sm transition-colors"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
