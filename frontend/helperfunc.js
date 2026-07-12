export const getStatusStyle = (status) => {
  const styles = {
    // initial
    uploaded: "bg-blue-50 text-blue-700 ring-blue-600/20",

    // processing stages
    timecode_processing: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    timecode_done: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    gemini_uploading: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    gemini_ready: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    rallies_processing: "bg-orange-50 text-orange-700 ring-orange-600/20",
    rallies_done: "bg-orange-50 text-orange-700 ring-orange-600/20",
    summary_processing: "bg-orange-50 text-orange-700 ring-orange-600/20",
    summary_done: "bg-orange-50 text-orange-700 ring-orange-600/20",
    insights_processing: "bg-orange-50 text-orange-700 ring-orange-600/20",
    insights_done: "bg-orange-50 text-orange-700 ring-orange-600/20",

    // terminal states
    finished: "bg-green-50 text-green-700 ring-green-600/20",
    failed: "bg-red-50 text-red-700 ring-red-600/20",
  }

  return styles[status] || "bg-gray-50 text-gray-700 ring-gray-600/20"
}

export const getStatusLabel = (status) => {
  const labels = {
    uploaded: "Uploaded",
    timecode_processing: "Processing",
    timecode_done: "Processing",
    gemini_uploading: "Processing",
    gemini_ready: "Processing",
    rallies_processing: "Analysing rallies",
    rallies_done: "Rallies done",
    summary_processing: "Analysing match",
    summary_done: "Match analysed",
    insights_processing: "Generating insights",
    insights_done: "Insights ready",
    finished: "Finished",
    failed: "Failed",
  }

  return labels[status] || status
}