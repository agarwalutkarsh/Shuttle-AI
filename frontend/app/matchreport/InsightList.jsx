import InsightCard from "./InsightCard"

export default function InsightsList({ insights = [] }) {
  if (!insights.length) return null

  const strengths = insights.filter(i => i.tag === "strength")
  const weaknesses = insights.filter(i => i.tag === "weakness")
  const improvements = insights.filter(i => i.tag === "improvement")

  // render in order: strengths first, then weaknesses, then improvements
  const ordered = [...strengths, ...weaknesses, ...improvements]

  return (
    <div className="ml-4 w-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-bulb text-amber-600 text-lg" aria-hidden="true" />
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          AI insights
        </h2>
        <span className="ml-auto text-xs text-gray-400">
          {insights.length} insights
        </span>
      </div>

      <div className="flex flex-col gap-2.5 h-60 overflow-auto scrollbar-none">
        {ordered.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  )
}