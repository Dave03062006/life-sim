import { describe, expect, it } from 'vitest'
import { stageOf } from '../life/stages'
import { hasIcon } from '../styles/art'
import { GAMES } from '../minigames/registry'
import { THEMES } from '../minigames/themes'
import { packFor } from './index'

const pack = packFor('indonesia')
const lateTeen = pack.activities.filter((a) => a.stages.includes('late-teen'))

describe('indonesia content', () => {
  it('offers 46 late-teen activities, at least four in every category', () => {
    expect(lateTeen).toHaveLength(46)
    for (const c of stageOf(16).categories) {
      expect({ c, ok: lateTeen.filter((a) => a.category === c).length >= 4 }).toEqual({ c, ok: true })
    }
  })
  it('gives every activity what the screen and the rules need', () => {
    expect(new Set(pack.activities.map((a) => a.id)).size).toBe(pack.activities.length)
    for (const a of pack.activities) {
      const linesSize = typeof a.lines === 'string' ? a.lines.length : Object.keys(a.lines).length
      expect({ id: a.id, ok: a.title.length > 2 }).toEqual({ id: a.id, ok: true })
      expect({ id: a.id, ok: a.description.length > 9 }).toEqual({ id: a.id, ok: true })
      expect({ id: a.id, ok: hasIcon(a.icon) }).toEqual({ id: a.id, ok: true })
      expect({ id: a.id, ok: linesSize > 3 }).toEqual({ id: a.id, ok: true })
      for (const r of a.requires ?? []) expect({ id: a.id, ok: r.reason.length > 9 }).toEqual({ id: a.id, ok: true })
      expect({ id: a.id, ok: !a.rest || a.energy === 0 }).toEqual({ id: a.id, ok: true })
      expect({ id: a.id, ok: !a.minigame || Object.keys(a.failPenalty ?? {}).length > 0 }).toEqual({ id: a.id, ok: true })
    }
  })
  it('gives every mini-game activity a game that is built', () => {
    for (const a of pack.activities.filter((x) => x.minigame)) {
      const type = a.minigame!.type
      expect({ id: a.id, built: GAMES[type].rules.type }).toEqual({ id: a.id, built: type })
    }
  })
  it('gives every quiz activity a question source', () => {
    for (const a of pack.activities.filter((x) => x.minigame?.type === 'quiz')) {
      expect({ id: a.id, has: !!THEMES[a.id]?.quiz }).toEqual({ id: a.id, has: true })
    }
  })
  it('marks the milestone at 17', () => {
    expect(pack.milestones[17]).toContain('KTP')
  })
})
