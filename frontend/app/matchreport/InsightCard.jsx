const tagConfig = {
  strength: {
    label: "Strength",
    cardClass: "bg-green-100 border-green-200",
    iconClass: "bg-green-100",
    badgeClass: "bg-green-300 text-green-800",
    iconName: "ti-check",
    iconColor: "text-green-800",
  },
  weakness: {
    label: "Weakness",
    cardClass: "bg-red-100 border-red-200",
    iconClass: "bg-red-100",
    badgeClass: "bg-red-300 text-red-800",
    iconName: "ti-alert-triangle",
    iconColor: "text-red-800",
  },
  improvement: {
    label: "Improvement",
    cardClass: "bg-amber-100 border-amber-200",
    iconClass: "bg-amber-100",
    badgeClass: "bg-amber-300 text-amber-800",
    iconName: "ti-trending-up",
    iconColor: "text-amber-800",
  },
}

export default function InsightCard({ insight }) {
  const config = tagConfig[insight.tag] || tagConfig.improvement

  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${config.cardClass}`}>
      {/* <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.iconClass}`}>
        <i className={`ti ${config.iconName} text-base ${config.iconColor}`} aria-hidden="true" />
      </div> */}
      <div>
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1.5 ${config.badgeClass}`}>
          {config.label}
        </span>
        <p className="text-sm text-gray-600 leading-relaxed">
          {insight.description}
        </p>
      </div>
    </div>
  )
}