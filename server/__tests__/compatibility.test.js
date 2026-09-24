import { describe, it, expect } from 'vitest'
import {
  computeCompatibility,
  explainCompatibility,
} from '../utils/compatibility.js'

const tidyMorningQuiet = {
  cleanliness: 'very',
  sleepSchedule: 'morning',
  noiseTolerance: 'quiet',
  guestFrequency: 'rarely',
  smoking: 'no',
  pets: 'okay',
  budgetMin: 900,
  budgetMax: 1300,
}

describe('explainCompatibility', () => {
  it('returns null when the viewer has no quiz answers', () => {
    expect(explainCompatibility(null, tidyMorningQuiet)).toBeNull()
    expect(explainCompatibility({ budgetMin: 1 }, tidyMorningQuiet)).toBeNull()
  })

  it('splits answered dimensions into shared, partial and differing', () => {
    const candidate = {
      ...tidyMorningQuiet,
      guestFrequency: 'sometimes', // adjacent to rarely -> partial
      sleepSchedule: 'night', // opposed -> differs
      pets: undefined, // unanswered -> ignored
    }
    const out = explainCompatibility(tidyMorningQuiet, candidate)
    expect(out.shared.map(d => d.key)).toEqual([
      'cleanliness',
      'smoking',
      'noiseTolerance',
    ])
    expect(out.partial.map(d => d.key)).toEqual(['guestFrequency'])
    expect(out.differs.map(d => d.key)).toEqual(['sleepSchedule'])
    // Shared entries carry the common value so the client can label it.
    expect(out.shared[0]).toEqual({ key: 'cleanliness', value: 'very' })
    // Differing entries carry both sides.
    expect(out.differs[0]).toEqual({
      key: 'sleepSchedule',
      viewer: 'morning',
      candidate: 'night',
    })
  })

  it('orders shared dimensions by weight, heaviest first', () => {
    const out = explainCompatibility(tidyMorningQuiet, tidyMorningQuiet)
    const keys = out.shared.map(d => d.key)
    expect(keys.indexOf('cleanliness')).toBeLessThan(keys.indexOf('pets'))
    expect(keys.indexOf('smoking')).toBeLessThan(keys.indexOf('guestFrequency'))
  })

  it('reports budget overlap as its own entry', () => {
    const overlapping = explainCompatibility(tidyMorningQuiet, {
      ...tidyMorningQuiet,
      budgetMin: 1200,
      budgetMax: 1600,
    })
    expect(overlapping.budget).toBe('partial')

    const disjoint = explainCompatibility(tidyMorningQuiet, {
      ...tidyMorningQuiet,
      budgetMin: 2000,
      budgetMax: 2500,
    })
    expect(disjoint.budget).toBe('none')

    const unknown = explainCompatibility(tidyMorningQuiet, {
      ...tidyMorningQuiet,
      budgetMin: null,
      budgetMax: null,
    })
    expect(unknown.budget).toBeNull()
  })

  it('agrees with computeCompatibility on which dimensions count', () => {
    const candidate = { cleanliness: 'relaxed', smoking: 'no' }
    const out = explainCompatibility(tidyMorningQuiet, candidate)
    expect(out.shared).toHaveLength(1)
    expect(out.differs).toHaveLength(1)
    // 1.5 (smoking) of 3.0 comparable weight = 50.
    expect(computeCompatibility(tidyMorningQuiet, candidate)).toBe(50)
  })
})
