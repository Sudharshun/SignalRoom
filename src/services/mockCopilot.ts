export type CopilotActionId =
  | 'summarize'
  | 'competing'
  | 'contradictory'
  | 'unowned'
  | 'next_step'
  | 'explain_leading'
  | 'exec_update'
  | 'postmortem'
  | 'challenge'

export interface CopilotSuggestion {
  id: string
  title: string
  body: string
  proposedChange?: {
    kind: 'confidence' | 'status' | 'none'
    nodeId?: string
    from?: string | number
    to?: string | number
    reason?: string
  }
  inspectNodeIds?: string[]
}

export interface CopilotResponse {
  actionId: CopilotActionId
  heading: string
  sections: { title: string; content: string }[]
  suggestion?: CopilotSuggestion
}

const RESPONSES: Record<CopilotActionId, CopilotResponse> = {
  summarize: {
    actionId: 'summarize',
    heading: 'Incident summary',
    sections: [
      {
        title: 'Situation',
        content:
          'SEV1 checkout failures (~31% in US-East) began at 10:42, four minutes after Payments API 4.18 deployed. Leading theory is a serialization regression (82% confidence). Database capacity ruled out. Payment gateway vendor engaged as secondary line.',
      },
      {
        title: 'Recovery',
        content:
          'IC Maya chose FIX FORWARD at 11:22. Patch created; staging validation in progress (currently blocked). Next: unblock staging, deploy, validate metrics.',
      },
    ],
  },
  competing: {
    actionId: 'competing',
    heading: 'Competing hypotheses',
    sections: [
      {
        title: 'Application',
        content: 'Serialization regression in Payments 4.18 — LIKELY 82%. Strong temporal + telemetry correlation.',
      },
      {
        title: 'Platform',
        content: 'Database capacity — RULED OUT 4%. CPU, pools, and query latency all normal.',
      },
      {
        title: 'External',
        content: 'Payment gateway degradation — INVESTIGATING 35%. Timeouts elevated; vendor case INC-88213 open.',
      },
    ],
    suggestion: {
      id: 'sug-add-hyp',
      title: 'Optional new hypothesis',
      body: 'Consider a combined failure mode: gateway latency amplifying a serializer timeout path.',
      proposedChange: { kind: 'none' },
      inspectNodeIds: ['hyp-serialization', 'hyp-vendor'],
    },
  },
  contradictory: {
    actionId: 'contradictory',
    heading: 'Contradictory evidence',
    sections: [
      {
        title: 'Against leading theory',
        content:
          '7% of checkout errors existed before Payments 4.18. This does not overturn the regression hypothesis but suggests a residual baseline or a co-occurring gateway issue.',
      },
    ],
    suggestion: {
      id: 'sug-inspect-counter',
      title: 'Inspect counter-evidence',
      body: 'Review the pre-deploy error cohort for gateway timeout signatures.',
      proposedChange: { kind: 'none' },
      inspectNodeIds: ['cev-preexisting', 'ev-gateway'],
    },
  },
  unowned: {
    actionId: 'unowned',
    heading: 'Unowned / blocked actions',
    sections: [
      {
        title: 'Blocked',
        content: 'Jordan — Validate patch in staging (BLOCKED on staging capacity).',
      },
      {
        title: 'Unstarted',
        content: 'Production deployment and metrics validation are TODO and depend on staging success.',
      },
    ],
  },
  next_step: {
    actionId: 'next_step',
    heading: 'Next diagnostic step',
    sections: [
      {
        title: 'Recommended',
        content:
          'Unblock staging capacity and replay the failing checkout payloads against the patch. In parallel, compare gateway timeout rates between instances on 4.17 vs 4.18 to bound vendor contribution.',
      },
    ],
  },
  explain_leading: {
    actionId: 'explain_leading',
    heading: 'Why serialization regression is leading',
    sections: [
      {
        title: 'Correlated signals',
        content:
          'Errors began ~4 minutes after deploy; only 4.18 instances show serialization exceptions; Datadog traces contain JsonProcessingException on the checkout path.',
      },
    ],
    suggestion: {
      id: 'sug-confidence',
      title: 'AI SUGGESTION',
      body: 'Evidence increasingly supports the deployment hypothesis.\n\nSuggested confidence:\n82% → 91%\n\nReason:\nThree independent telemetry signals now correlate with instances running version 4.18.',
      proposedChange: {
        kind: 'confidence',
        nodeId: 'hyp-serialization',
        from: 82,
        to: 91,
        reason: 'Three independent telemetry signals correlate with 4.18 instances.',
      },
      inspectNodeIds: ['ev-timing', 'ev-instances', 'ev-traces'],
    },
  },
  exec_update: {
    actionId: 'exec_update',
    heading: 'Executive update (draft)',
    sections: [
      {
        title: 'For leadership',
        content:
          'We are in an active SEV1 on checkout (~31% failure, US-East, ~18k attempts). Root cause candidate is a Payments API 4.18 serialization regression. We are fixing forward with a patch in staging; payment vendor is engaged for residual gateway timeouts. Next update at 11:35. IC: Maya.',
      },
    ],
  },
  postmortem: {
    actionId: 'postmortem',
    heading: 'Postmortem timeline (draft)',
    sections: [
      {
        title: 'Chronology',
        content:
          '10:37 Deploy 4.18 → 10:42 Alert → 10:46 Prod Call → 10:56 DB ruled out → 11:02 Vendor engaged → 11:13 Serialization likely → 11:18 Patch → 11:22 Fix-forward decision → 11:26 Staging validation.',
      },
    ],
  },
  challenge: {
    actionId: 'challenge',
    heading: 'Challenge current diagnosis',
    sections: [
      {
        title: 'CURRENT LEADING THEORY',
        content: 'Payments 4.18 serialization regression\n82% confidence',
      },
      {
        title: 'POTENTIAL CONTRADICTION',
        content: '7% of failures occurred before deployment.',
      },
      {
        title: 'ALTERNATIVE EXPLANATION',
        content:
          'Payment gateway degradation may have started before the application deployment.',
      },
      {
        title: 'RECOMMENDED TEST',
        content:
          'Compare gateway timeout rates between instances running 4.17 and 4.18.',
      },
    ],
    suggestion: {
      id: 'sug-challenge',
      title: 'Avoid tunnel vision',
      body: 'Keep the vendor hypothesis alive until version-split gateway metrics are compared.',
      proposedChange: { kind: 'none' },
      inspectNodeIds: ['hyp-vendor', 'cev-preexisting', 'exp-version-compare'],
    },
  },
}

export function runCopilotAction(actionId: CopilotActionId): CopilotResponse {
  return structuredClone(RESPONSES[actionId])
}

export const COPILOT_ACTIONS: { id: CopilotActionId; label: string }[] = [
  { id: 'summarize', label: 'Summarize incident' },
  { id: 'competing', label: 'Suggest competing hypotheses' },
  { id: 'contradictory', label: 'Find contradictory evidence' },
  { id: 'unowned', label: 'Identify unowned actions' },
  { id: 'next_step', label: 'Suggest next diagnostic step' },
  { id: 'explain_leading', label: 'Explain why leading hypothesis is likely' },
  { id: 'exec_update', label: 'Generate executive update' },
  { id: 'postmortem', label: 'Create postmortem timeline' },
  { id: 'challenge', label: 'Challenge Current Diagnosis' },
]
