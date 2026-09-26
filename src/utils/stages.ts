import type { MatchStage, MatchStageType } from '../types/domain'

export const STAGE_TYPES: Array<{ value: MatchStageType; label: string }> = [
  { value: 'league', label: 'League' },
  { value: 'group', label: 'Group' },
  { value: 'knockout', label: 'Knockout' },
]

export const GROUP_STAGES: Array<{ value: MatchStage; label: string }> = [
  { value: 'group', label: 'Group' },
]

export const KNOCKOUT_STAGES: Array<{ value: MatchStage; label: string }> = [
  { value: 'quarterfinal', label: 'Quarter Final' },
  { value: 'semifinal', label: 'Semi Final' },
  { value: 'final', label: 'Final' },
]

export function stageLabelFor(stage: MatchStage | null | undefined): string {
  if (stage === 'quarterfinal') return 'Quarter Final'
  if (stage === 'semifinal') return 'Semi Final'
  if (stage === 'group') return 'Group'
  if (stage === 'league') return 'League'
  return '—'
}

export function knockoutStagesFor(stageType: MatchStageType): Array<{ value: MatchStage; label: string }> {
  return stageType === 'knockout' ? KNOCKOUT_STAGES : GROUP_STAGES
}

export function autoStageName(
  stageType: MatchStageType,
  stage: MatchStage,
  roundNumber: number | string,
): string | null {
  if (stageType === 'league') return `Matchday ${roundNumber}`
  if (stageType === 'knockout') {
    if (stage === 'quarterfinal') return 'Quarter Final'
    if (stage === 'semifinal') return 'Semi Final'
    if (stage === 'final') return 'Final'
    return null
  }
  return null
}