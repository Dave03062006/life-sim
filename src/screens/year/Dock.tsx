import { energyBudget, energyLeft } from '../../life/energy'
import { stageOf } from '../../life/stages'
import type { CategoryId, Life } from '../../life/types'
import { Icon } from '../../ui/Icon'
import { categoryLabel } from './labels'

const energyText = (left: number, budget: number) => (left > 0 ? `${left} of ${budget} left` : left === 0 ? 'None left' : `${-left} over`)

const energyTip = (left: number) =>
  left > 3
    ? 'Rest gives energy back. Each rest this year gives less.'
    : left > 0
      ? 'Running low. Rest, or push on.'
      : 'Out of energy. Anything more is overwork: Stress up, Health down.'

interface DockProps {
  life: Life
  open: CategoryId | null
  onToggle(category: CategoryId): void
  onAgeUp(): void
}

/** Energy for the year, the categories, and the age-up button between them. */
export function Dock({ life, open, onToggle, onAgeUp }: DockProps) {
  const budget = energyBudget(life)
  const left = energyLeft(life)
  const categories = stageOf(life.age).categories
  const cat = (id: CategoryId) => (
    <button key={id} className="cat" aria-pressed={open === id} onClick={() => onToggle(id)}>
      <Icon id={`cat-${id}`} fallback="cat-school" />
      {categoryLabel(life, id)}
    </button>
  )
  return (
    <nav className="card dock" aria-label="Activities and age up">
      <div className="energy">
        <Icon id="ui-energy" fallback="cat-rest" small />
        <b>Energy</b>
        <div className="pips" aria-hidden="true">
          {Array.from({ length: budget }, (_, i) => (
            <i key={i} className={i < left ? undefined : 'off'} />
          ))}
          {Array.from({ length: Math.max(0, -left) }, (_, i) => (
            <i key={`over-${i}`} className="over" />
          ))}
        </div>
        <span className="left">{energyText(left, budget)}</span>
        <span className="tip">{energyTip(left)}</span>
      </div>
      <div className="cats">
        {categories.slice(0, 4).map(cat)}
        <button className="age" onClick={onAgeUp}>
          <small>Age up</small>
          <b>Turn {life.age + 1}</b>
        </button>
        {categories.slice(4).map(cat)}
      </div>
    </nav>
  )
}
