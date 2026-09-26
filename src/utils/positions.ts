export const POSITIONS = [
  { value: 'goalkeeper', label: 'Goalkeeper' },
  { value: 'defender', label: 'Defender' },
  { value: 'midfielder', label: 'Midfielder' },
  { value: 'forward', label: 'Forward' },
]

export function positionLabel(value: string | null | undefined): string {
  return POSITIONS.find((position) => position.value === value)?.label ?? '—'
}