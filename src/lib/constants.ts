export const STATUSES = [
  "draft",
  "planned",
  "in_progress",
  "in_review",
  "done",
  "released",
  "cancelled",
] as const;
export type WorkStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<WorkStatus, string> = {
  draft: "Draft",
  planned: "Planned",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  released: "Released",
  cancelled: "Cancelled",
};

export const STATUS_COLOR: Record<WorkStatus, string> = {
  draft: "bg-status-draft/15 text-status-draft border-status-draft/30",
  planned: "bg-status-planned/15 text-status-planned border-status-planned/30",
  in_progress: "bg-status-in-progress/15 text-status-in-progress border-status-in-progress/30",
  in_review: "bg-status-in-review/15 text-status-in-review border-status-in-review/30",
  done: "bg-status-done/15 text-status-done border-status-done/30",
  released: "bg-status-released/15 text-status-released border-status-released/30",
  cancelled: "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
};

export const PRIORITIES = ["p0", "p1", "p2", "p3"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABEL: Record<Priority, string> = {
  p0: "P0 — Critical",
  p1: "P1 — High",
  p2: "P2 — Medium",
  p3: "P3 — Low",
};
export const PRIORITY_COLOR: Record<Priority, string> = {
  p0: "bg-priority-p0/15 text-priority-p0 border-priority-p0/30",
  p1: "bg-priority-p1/15 text-priority-p1 border-priority-p1/30",
  p2: "bg-priority-p2/15 text-priority-p2 border-priority-p2/30",
  p3: "bg-priority-p3/15 text-priority-p3 border-priority-p3/30",
};

export const RELEASE_STATUSES = ["planned", "in_development", "released", "deprecated"] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];
export const RELEASE_STATUS_LABEL: Record<ReleaseStatus, string> = {
  planned: "Planned",
  in_development: "In Development",
  released: "Released",
  deprecated: "Deprecated",
};
