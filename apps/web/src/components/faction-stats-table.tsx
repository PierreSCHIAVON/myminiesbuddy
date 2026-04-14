'use client'

import { useState } from 'react'

interface FactionRow {
  faction: {
    id: string
    name: string
    group: string | null
  }
  stat: {
    players: number
    wins: number
    losses: number
    draws: number
    winRate: number
    metaPct: number
  } | null
}

interface Props {
  rows: FactionRow[]
  labels: {
    faction: string
    players: string
    meta: string
    wins: string
    losses: string
    draws: string
    winRate: string
    showAll: string
    showLess: string
    noData: string
    basedOn: string  // déjà interpolé côté server
  }
}

export function FactionStatsTable({ rows, labels }: Props) {
  const [showAll, setShowAll] = useState(false)

  const withData = rows.filter((r) => r.stat !== null)
  const withoutData = rows.filter((r) => r.stat === null)

  const visibleRows = showAll ? rows : withData

  if (rows.length === 0) return null

  return (
    <div>
      {/* Contexte */}
      {labels.basedOn && (
        <p className="text-xs text-gray-500 mb-4">{labels.basedOn}</p>
      )}

      {withData.length === 0 ? (
        <div className="py-12 text-center text-gray-500 border border-dashed border-gray-700 rounded-xl">
          {labels.noData}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-900/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-400 w-10">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400">{labels.faction}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-400">{labels.players}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-400">{labels.meta}</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-400">{labels.wins}</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-400">{labels.losses}</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-400">{labels.draws}</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-400">{labels.winRate}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(({ faction, stat }, idx) => (
                  <tr
                    key={faction.id}
                    className={`border-b border-border/50 hover:bg-gray-900/40 transition-colors ${
                      !stat ? 'opacity-40' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {stat ? idx + 1 : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{faction.name}</div>
                      {faction.group && (
                        <div className="text-xs text-gray-500">{faction.group}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {stat ? stat.players : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {stat
                        ? <span className="text-orange-400 font-semibold">{stat.metaPct}%</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center text-green-400">
                      {stat ? stat.wins : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center text-red-400">
                      {stat ? stat.losses : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400">
                      {stat ? stat.draws : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stat ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all"
                              style={{ width: `${stat.winRate}%` }}
                            />
                          </div>
                          <span
                            className={`font-bold tabular-nums w-10 text-right text-sm ${
                              stat.winRate >= 60
                                ? 'text-green-400'
                                : stat.winRate >= 40
                                ? 'text-orange-400'
                                : 'text-red-400'
                            }`}
                          >
                            {stat.winRate}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-700 text-xs font-mono">TBD</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Toggle TBD */}
          {withoutData.length > 0 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2"
            >
              {showAll ? labels.showLess : labels.showAll}
            </button>
          )}
        </>
      )}
    </div>
  )
}
