export interface SummaryOptions {
  showPositions?: boolean
  showComments?: boolean
  showTypes?: boolean
  compact?: boolean
}

export const DEFAULT_SUMMARY_OPTIONS: Required<SummaryOptions> = {
  showPositions: true,
  showComments: true,
  showTypes: true,
  compact: false
}
