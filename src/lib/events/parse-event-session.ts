import { LABS, type EventSession, type LabId, type TrackerViewMode } from "@/lib/events/types"

export function parseEventSession(id: string, data: Record<string, unknown>): EventSession {
  const lab = typeof data.trackerLab === "string" && LABS.some((item) => item.id === data.trackerLab)
    ? data.trackerLab as LabId
    : null
  const trackerViewMode: TrackerViewMode =
    data.trackerViewMode === "lab" || data.trackerViewMode === "commitment" || data.trackerViewMode === "newest"
      ? data.trackerViewMode
      : "overview"

  return {
    id,
    name: typeof data.name === "string" ? data.name : "PULSE Summit",
    code: typeof data.code === "string" ? data.code : id,
    status: data.status === "closed" || data.status === "draft" ? data.status : "live",
    activeExperience:
      data.activeExperience === "poll" ||
      data.activeExperience === "wordcloud" ||
      data.activeExperience === "leaderboard" ||
      data.activeExperience === "tracker" ||
      data.activeExperience === "prediction"
        ? data.activeExperience
        : "lobby",
    activePromptId: typeof data.activePromptId === "string" ? data.activePromptId : null,
    trackerViewMode,
    trackerLab: lab,
    trackerCommitmentId: typeof data.trackerCommitmentId === "string" ? data.trackerCommitmentId : null,
  }
}
