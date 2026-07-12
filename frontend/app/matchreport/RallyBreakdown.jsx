export default function RallyBreakdown({ rallies = [] }) {
  if (!rallies.length) return null

  const sorted = [...rallies].sort((a, b) => a.rally_number - b.rally_number)
  const maxShots = Math.max(...rallies.map(r => r.shot_count))

  const getTypeStats = (type) => {
    const group = rallies.filter(r => r.rally_type === type)
    const won = group.filter(r => r.winner === "player").length
    const total = group.length
    const pct = total ? Math.round((won / total) * 100) : 0
    return { won, total, pct }
  }

  const getServeStats = (server) => {
    const group = rallies.filter(r => r.server === server)
    const won = group.filter(r => r.winner === "player").length
    const total = group.length
    const pct = total ? Math.round((won / total) * 100) : 0
    const avgShots = total
      ? Math.round(group.reduce((a, r) => a + r.shot_count, 0) / total)
      : 0
    return { won, total, pct, avgShots }
  }

  const getPillStyle = (pct) => {
    if (pct >= 60) return "bg-green-900 text-green-300"
    if (pct >= 45) return "bg-yellow-900 text-yellow-300"
    return "bg-red-900 text-red-300"
  }

  const getPctColor = (pct) => {
    if (pct >= 60) return "text-green-400"
    if (pct >= 45) return "text-yellow-400"
    return "text-red-400"
  }

  const getPillLabel = (pct) => {
    if (pct >= 60) return "strong"
    if (pct >= 45) return "average"
    return "weak"
  }

  const types = [
    { key: "short", label: "Short", sub: "1–4 shots" },
    { key: "medium", label: "Medium", sub: "5–15 shots" },
    { key: "long", label: "Long", sub: "15+ shots" },
  ]

  const serve = getServeStats("player")
  const receive = getServeStats("opponent")

  return (
    <div className="bg-gray-900 w-full my-5 mx-4 rounded-xl p-4">

      {/* header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
        <i className="ti ti-chart-bar text-blue-400 text-base" aria-hidden="true" />
        <h2 className="text-sm font-medium text-gray-100">Rally breakdown</h2>
        <span className="ml-auto text-xs text-gray-500">{rallies.length} rallies</span>
      </div>

      {/* win rate by type */}
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Win rate by rally length</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {types.map(({ key, label, sub }) => {
          const { won, total, pct } = getTypeStats(key)
          return (
            <div key={key} className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xs text-gray-600 mb-2">{sub}</p>
              <p className={`text-xl font-medium ${getPctColor(pct)}`}>{pct}%</p>
              <p className="text-xs text-gray-500 mt-1">{total} rallies · {won} won</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1.5 ${getPillStyle(pct)}`}>
                {getPillLabel(pct)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="h-px bg-gray-800 mb-4" />

      {/* serve vs receive */}
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Serve vs receive</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { stats: serve, label: "When you serve", icon: "ti-arrow-up-circle", iconColor: "text-blue-400" },
          { stats: receive, label: "When opponent serves", icon: "ti-arrow-down-circle", iconColor: "text-amber-400" },
        ].map(({ stats, label, icon, iconColor }) => (
          <div key={label} className="bg-gray-800 rounded-lg p-3">
            <p className={`text-xs text-gray-400 flex items-center gap-1.5 mb-2`}>
              <i className={`ti ${icon} text-sm ${iconColor}`} aria-hidden="true" />
              {label}
            </p>
            <div className="space-y-1.5 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Rallies</span>
                <span className="text-gray-100 font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Won</span>
                <span className={`font-medium ${stats.pct >= 50 ? "text-green-400" : "text-red-400"}`}>
                  {stats.won} ({stats.pct}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg shots</span>
                <span className="text-gray-100 font-medium">{stats.avgShots}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-4">W</span>
                <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-7 text-right">{stats.pct}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-4">L</span>
                <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${100 - stats.pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-7 text-right">{100 - stats.pct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-800 mb-4" />

      {/* timeline */}
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Rally timeline</p>
      <div className="flex gap-0.5 items-end h-12">
        {sorted.map(r => {
          const h = Math.max(4, Math.round((r.shot_count / maxShots) * 44))
          const color = r.winner === "player" ? "bg-blue-500" : "bg-red-500"
          return (
            <div
              key={r.id}
              className={`flex-1 rounded-sm ${color}`}
              style={{ height: `${h}px` }}
              title={`Rally ${r.rally_number}: ${r.shot_count} shots · ${r.winner === "player" ? "won" : "lost"}`}
            />
          )
        })}
      </div>
      <div className="flex gap-3 mt-2">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-sm bg-blue-500" />
          point won
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-sm bg-red-500" />
          point lost
        </div>
        <span className="ml-auto text-xs text-gray-600">height = shot count</span>
      </div>

    </div>
  )
}