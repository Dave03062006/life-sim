import type { CategoryId, StageId } from '../../life/types'

export const CATEGORY: Record<CategoryId, { label: string; blurb: string }> = {
  school: { label: 'School', blurb: 'Classes, exams and clubs. This becomes Work once you leave school.' },
  mind: { label: 'Mind', blurb: 'Read, learn and think. Mostly Smarts.' },
  body: { label: 'Body', blurb: 'Sports and training. Health and Looks.' },
  health: { label: 'Health', blurb: 'Doctors, medicine and habits. Treat illness before it gets worse.' },
  people: { label: 'People', blurb: 'Family, friends and romance. Closeness grows when you show up.' },
  money: { label: 'Money', blurb: 'Earn it, save it, spend it.' },
  fun: { label: 'Fun', blurb: 'Play, music and going out. Happiness up, Stress down.' },
  rest: { label: 'Rest', blurb: 'Rest gives energy back. Each rest this year restores less than the one before.' },
}

// shortcut: Indonesian school names for every country; move into the content pack when a second country arrives.
export const STAGE_LABEL: Record<StageId, string> = {
  baby: 'Baby',
  'small-child': 'Toddler',
  child: 'SD',
  'early-teen': 'SMP',
  'late-teen': 'SMA',
  'young-adult': 'Young adult',
  adult: 'Adult',
  senior: 'Senior',
}
