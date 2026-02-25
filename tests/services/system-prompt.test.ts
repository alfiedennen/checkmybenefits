import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../../src/services/system-prompt.ts'
import { looksLikeCompletion } from '../../src/engine/critical-fields.ts'
import { createEmptyPerson } from '../../src/types/person.ts'
import type { PersonData } from '../../src/types/person.ts'
import type { ConversationStage, SituationId } from '../../src/types/conversation.ts'

/**
 * System Prompt Tests
 *
 * These verify the system prompt contains the right guardrails for AI
 * conversation management. Found via multi-turn eval failures:
 *
 * - MT07: AI completed without postcode (bereavement scenario)
 * - MT05: AI completed without postcode (carer scenario)
 * - MT03: AI didn't populate child_benefit (dense input scenario)
 *
 * Root cause: The prompt told the AI not to complete without 4 fields,
 * but the instruction wasn't strong enough — the AI ignored it under
 * emotional/complex contexts.
 */

// ── Helpers ─────────────────────────────────────────

function promptFor(
  stage: ConversationStage,
  overrides: Partial<PersonData> = {},
  situations: SituationId[] = [],
): string {
  const person = { ...createEmptyPerson(), ...overrides }
  return buildSystemPrompt(stage, person, situations)
}

// ── Scope boundary ─────────────────────────────────

describe('System Prompt — Scope boundary', () => {
  it('includes scope restriction in conversation rules', () => {
    const prompt = promptFor('intake')
    expect(prompt).toMatch(/SCOPE/i)
    expect(prompt).toMatch(/only.*help.*benefits/i)
  })

  it('explicitly prohibits CV writing and career coaching', () => {
    const prompt = promptFor('questions')
    expect(prompt).toMatch(/CV/i)
    expect(prompt).toMatch(/career coaching/i)
  })

  it('instructs redirect to benefits rather than helping off-topic', () => {
    const prompt = promptFor('intake')
    expect(prompt).toMatch(/NEVER generate.*poems|Do not provide any part/i)
  })

  it('situation taxonomy no longer says "no scope restrictions"', () => {
    const prompt = promptFor('intake')
    expect(prompt).not.toMatch(/no scope restrictions/i)
  })

  it('prohibits AI from listing benefit names in messages', () => {
    const prompt = promptFor('questions')
    expect(prompt).toMatch(/NEVER.*list.*benefits.*yourself/i)
    expect(prompt).toMatch(/stage_transition.*complete/i)
  })
})

// ── Gate field alignment ────────────────────────────

describe('System Prompt — Gate field alignment', () => {
  it('questions stage lists all 5 critical gate fields', () => {
    const prompt = promptFor('questions')
    expect(prompt).toContain('employment_status')
    expect(prompt).toContain('income_band')
    expect(prompt).toContain('housing_tenure')
    expect(prompt).toContain('postcode')
    expect(prompt).toMatch(/age.*must not be null/i)
  })

  it('questions stage explicitly says do NOT complete if any gate field is missing', () => {
    const prompt = promptFor('questions')
    // Must contain a clear prohibition on completing without all 4 fields
    expect(prompt).toMatch(/(?:do NOT|MUST).*(?:complete|stage_transition)/i)
  })

  it('questions stage mentions postcode as a required field, not just recommended', () => {
    const prompt = promptFor('questions')
    // Postcode must appear in the COMPLETION GATE section, not just the RECOMMENDED section
    const gateSection = prompt.match(/COMPLETION GATE.*?(?=STRONGLY RECOMMENDED)/s)?.[0] ?? ''
    expect(gateSection).toContain('postcode')
  })

  it('postcode is listed as the LAST field to ask for', () => {
    const prompt = promptFor('questions')
    expect(prompt).toMatch(/postcode.*last/i)
  })

  it('requires employment and housing BEFORE postcode in question order', () => {
    const prompt = promptFor('questions')
    expect(prompt).toMatch(/employment.*BEFORE.*postcode/is)
    expect(prompt).toMatch(/housing.*BEFORE.*postcode/is)
  })
})

// ── Premature completion guards ─────────────────────

describe('System Prompt — Premature completion guards', () => {
  it('questions stage warns against completing without postcode specifically', () => {
    const prompt = promptFor('questions')
    // The prompt should explicitly call out postcode as a common miss
    expect(prompt).toMatch(/postcode/i)
    // And it should be in a context that says "do not complete" or "must have"
    expect(prompt).toMatch(/(?:do not|never|must not|cannot).*complete.*(?:without|missing|until)/is)
  })

  it('questions stage includes explicit checklist before completing', () => {
    const prompt = promptFor('questions')
    // Should have a clear enumeration of fields to check before completing
    expect(prompt).toContain('employment_status')
    expect(prompt).toContain('income_band')
    expect(prompt).toContain('housing_tenure')
    expect(prompt).toContain('postcode')
  })

  it('questions stage does NOT allow fabricating a postcode', () => {
    const prompt = promptFor('questions')
    // The AI should never default to a placeholder postcode
    expect(prompt).toMatch(/do not.*(?:guess|fabricat|default|placeholder).*postcode/is)
  })

  it('questions stage accepts partial postcodes', () => {
    const prompt = promptFor('questions')
    expect(prompt).toMatch(/partial postcode/i)
  })
})

// ── Current context injection ───────────────────────

describe('System Prompt — Current context', () => {
  it('shows collected fields in current_context', () => {
    const prompt = promptFor('questions', {
      employment_status: 'unemployed',
      income_band: 'under_7400',
    }, ['lost_job'])

    expect(prompt).toContain('current_context')
    expect(prompt).toContain('unemployed')
    expect(prompt).toContain('under_7400')
    expect(prompt).toContain('lost_job')
  })

  it('shows null/missing fields so AI can see what to ask for', () => {
    const prompt = promptFor('questions', {
      employment_status: 'unemployed',
      income_band: 'under_7400',
      // housing_tenure and postcode missing
    })

    // The current context should show the full PersonData including null fields
    // so the AI can see what's missing
    expect(prompt).toContain('current_context')
    expect(prompt).toContain('housing_tenure')
    expect(prompt).toContain('postcode')
  })

  it('includes situation data when situations are classified', () => {
    const prompt = promptFor('questions', {}, ['bereavement', 'ageing_parent'])
    expect(prompt).toContain('bereavement')
    expect(prompt).toContain('ageing_parent')
  })

  it('reminds AI not to re-ask about collected fields', () => {
    const prompt = promptFor('questions', { postcode: 'E1 6AN' })
    expect(prompt).toMatch(/do not re-?ask/i)
  })
})

// ── Stage-specific instructions ─────────────────────

describe('System Prompt — Stage instructions', () => {
  it('intake stage instructs extraction of ALL available data', () => {
    const prompt = promptFor('intake')
    expect(prompt).toMatch(/extract.*everything/i)
  })

  it('questions stage instructs ONE question at a time', () => {
    const prompt = promptFor('questions')
    expect(prompt).toMatch(/one question/i)
  })

  it('complete stage instructions focus on results, not data collection', () => {
    const prompt = promptFor('complete')
    // The stage_instructions section for complete should mention results/entitlements
    expect(prompt).toContain('found')
    expect(prompt).toContain('entitlement')
    // And should not mention gathering more data in the stage instructions
    const stageSection = prompt.match(/<stage_instructions>([\s\S]*?)<\/stage_instructions>/)?.[1] ?? ''
    expect(stageSection).not.toMatch(/ask.*postcode/i)
    expect(stageSection).not.toMatch(/gather.*information/i)
  })

  it('questions stage has bereavement sensitivity instructions', () => {
    const prompt = promptFor('questions')
    expect(prompt).toMatch(/bereavement/i)
    expect(prompt).toMatch(/empath/i)
  })
})

// ── Scenario-specific regression tests ──────────────

describe('System Prompt — Regression: MT07 Bereavement premature complete', () => {
  /**
   * MT07 failed because the AI completed after "we own our home" without
   * having a postcode. The prompt must make it clear that even in emotional
   * contexts, postcode is mandatory before completion.
   */
  it('prompt with missing postcode still shows postcode as required', () => {
    const prompt = promptFor('questions', {
      is_bereaved: true,
      deceased_relationship: 'partner',
      age: 68,
      employment_status: 'retired',
      income_band: 'under_12570',
      housing_tenure: 'own_outright',
      // NO postcode
    }, ['bereavement'])

    // The prompt should show postcode is still null/missing in current_context
    expect(prompt).toContain('current_context')
    // And the stage instructions should still say "do not complete without postcode"
    expect(prompt).toMatch(/(?:do NOT|MUST).*(?:complete|stage_transition)/i)
  })

  it('sensitivity rules do NOT override gate requirements', () => {
    const prompt = promptFor('questions')
    // Sensitivity section should not suggest skipping required fields
    // for emotional situations
    expect(prompt).not.toMatch(/skip.*required.*bereavement/i)
    expect(prompt).not.toMatch(/bereavement.*skip.*required/i)
  })
})

describe('System Prompt — Regression: MT05 Carer premature complete', () => {
  /**
   * MT05 failed because the AI completed after "council house, £400"
   * before getting the postcode. It even fabricated SW1A 1AA.
   */
  it('prompt with missing postcode after housing shows postcode still needed', () => {
    const prompt = promptFor('questions', {
      is_carer: true,
      carer_hours_per_week: 40,
      employment_status: 'unemployed',
      income_band: 'under_7400',
      housing_tenure: 'rent_social',
      // NO postcode
    }, ['ageing_parent'])

    expect(prompt).toContain('current_context')
    expect(prompt).toMatch(/(?:do NOT|MUST).*(?:complete|stage_transition)/i)
  })
})

describe('System Prompt — Regression: MT03 child_benefit miss', () => {
  /**
   * MT03: "just had a baby" should trigger child_benefit, but AI set
   * is_pregnant: false and expecting_first_child: false without populating
   * the children array. The prompt should guide the AI to create a child
   * entry for a baby that has already been born.
   */
  it('prompt mentions children array should include existing children', () => {
    const prompt = promptFor('intake')
    expect(prompt).toMatch(/children/i)
    // Should instruct to populate children array, not just pregnancy fields
    expect(prompt).toMatch(/ALL.*children/i)
  })
})

// ── Implicit completion detection ────────────────────

describe('looksLikeCompletion — detects AI completion text without XML tag', () => {
  it('detects "Take a look below"', () => {
    expect(looksLikeCompletion(
      'Based on what you have told me, I have found several things you may be entitled to. Take a look below — the ones marked START HERE are the most important.',
    )).toBe(true)
  })

  it('detects "found things you may be entitled to"', () => {
    expect(looksLikeCompletion(
      'I have found things you may be entitled to.',
    )).toBe(true)
  })

  it('detects "START HERE"', () => {
    expect(looksLikeCompletion(
      'The ones marked START HERE are the most important.',
    )).toBe(true)
  })

  it('detects "your results are below"', () => {
    expect(looksLikeCompletion('Here are your results below.')).toBe(true)
  })

  it('detects "display it below"', () => {
    expect(looksLikeCompletion(
      'I will gather this information and display it below for you to review.',
    )).toBe(true)
  })

  it('detects "you may be eligible"', () => {
    expect(looksLikeCompletion(
      'It looks like you may be eligible for some additional support.',
    )).toBe(true)
  })

  it('detects "here are some potential"', () => {
    expect(looksLikeCompletion(
      'Here are some potential supports you may be eligible for.',
    )).toBe(true)
  })

  it('detects AI listing specific benefit names', () => {
    expect(looksLikeCompletion(
      'Attendance Allowance is something you may be eligible for.',
    )).toBe(true)
  })

  it('does NOT match normal question text', () => {
    expect(looksLikeCompletion(
      'Thanks for that. What is your postcode?',
    )).toBe(false)
  })

  it('does NOT match empathetic acknowledgement', () => {
    expect(looksLikeCompletion(
      'I am sorry to hear that. Let me ask a few questions to see what support is available.',
    )).toBe(false)
  })
})
