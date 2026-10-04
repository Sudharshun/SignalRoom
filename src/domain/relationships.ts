export type RelationshipType =
  | 'caused-by'
  | 'supports'
  | 'contradicts'
  | 'correlates-with'
  | 'depends-on'
  | 'investigated-by'
  | 'owned-by'
  | 'mitigated-by'
  | 'triggered-by'
  | 'preceded-by'

export interface Relationship {
  id: string
  sourceId: string
  targetId: string
  type: RelationshipType
  label?: string
}

export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  'caused-by': '#f97316',
  supports: '#22c55e',
  contradicts: '#ef4444',
  'correlates-with': '#38bdf8',
  'depends-on': '#818cf8',
  'investigated-by': '#3b82f6',
  'owned-by': '#a78bfa',
  'mitigated-by': '#14b8a6',
  'triggered-by': '#eab308',
  'preceded-by': '#94a3b8',
}

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  'caused-by': 'caused-by',
  supports: 'supports',
  contradicts: 'contradicts',
  'correlates-with': 'correlates-with',
  'depends-on': 'depends-on',
  'investigated-by': 'investigated-by',
  'owned-by': 'owned-by',
  'mitigated-by': 'mitigated-by',
  'triggered-by': 'triggered-by',
  'preceded-by': 'preceded-by',
}
