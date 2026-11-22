import type { CareerDef, CareerStep, Requirement } from '../../types'

const UPPER: Requirement = { kind: 'school', levels: ['sma', 'smk', 'paket-c'], reason: 'Needs SMA, SMK or Paket C.' }
const TOP: Requirement = { kind: 'stat', key: 'reputation', min: 60, reason: 'Needs Reputation 60 or more.', openNote: 'Open to you: Reputation 60+' }

type Row = [title: string, salary: number, hours?: 'part']
// Each row is one step; the last one of a ladder needs Reputation 60 unless `top` is false. `entry` joins the first step.
function ladder(rows: Row[], entry: Requirement[] = [], top = true): CareerStep[] {
  return rows.map(([title, salary, hours], i): CareerStep => {
    const requires = [...(i === 0 ? entry : []), ...(top && i === rows.length - 1 ? [TOP] : [])]
    return { title, salary, hours: hours ?? 'full', ...(requires.length > 0 && { requires }) }
  })
}

// Salaries are Rp a year (monthly figure x 12). Anchors: Kepgub DKI Jakarta UMP 2025 Rp 5.396.761 a month;
// Central Java UMP 2025 Rp 2.169.349 a month; entry rows sit between the two, higher rungs follow Jobstreet/Glints salary guides.
export const careers: CareerDef[] = [
  // Warung and minimarket pay near the regional UMP; the part-time helper earns about Rp 1,5 million a month.
  { id: 'shop', name: 'Shop work', minAge: 15, steps: ladder([['Warung helper', 18_000_000, 'part'], ['Shop assistant', 30_000_000], ['Shift supervisor', 45_000_000], ['Store manager', 84_000_000]]) },
  // Office clerk about Rp 4 million a month (Jobstreet Indonesia salary guide, admin roles); manager about Rp 15 million.
  { id: 'office', name: 'Office work', minAge: 18, steps: ladder([['Office clerk', 48_000_000], ['Admin officer', 66_000_000], ['Supervisor', 108_000_000], ['Manager', 180_000_000]], [UPPER]) },
  // Honorary (honorer) teachers often earn Rp 1 to 2 million a month; certified civil-service teachers about Rp 4,5 million and up (PP on PNS salaries).
  { id: 'teaching', name: 'Teaching', minAge: 18, steps: ladder([['Honorary teacher', 18_000_000], ['Teacher', 54_000_000], ['Senior teacher', 78_000_000], ['Head teacher', 108_000_000]], [{ kind: 'field', field: 'education', reason: 'Needs a degree in education.' }]) },
  // Nurse about Rp 4,5 million a month, senior and head nurses follow hospital grades (Jobstreet and Glints salary guides).
  { id: 'nursing', name: 'Nursing', minAge: 18, steps: ladder([['Nurse', 54_000_000], ['Senior nurse', 78_000_000], ['Head nurse', 108_000_000]], [{ kind: 'field', field: 'health', reason: 'Needs a degree in health.' }]) },
  // Junior developer about Rp 7 million a month, tech lead about Rp 30 million (Glints and Jobstreet tech salary guides).
  { id: 'software', name: 'Software', minAge: 18, steps: ladder([['Junior developer', 84_000_000], ['Developer', 144_000_000], ['Senior developer', 240_000_000], ['Tech lead', 360_000_000]],
    [UPPER, { kind: 'stat', key: 'smarts', min: 70, reason: 'Needs Smarts 70 or more.', openNote: 'Open to you: Smarts 70+' }]) },
  // Ojek online earns about Rp 3 million a month after the platform cut; couriers near UMP (driver earnings reports, Jobstreet).
  { id: 'driving', name: 'Driving', minAge: 17, steps: ladder([['Ojek driver', 36_000_000, 'part'], ['Courier', 48_000_000], ['Delivery team lead', 72_000_000]], [{ kind: 'owns', item: 'motorbike', reason: 'You need a motorbike.' }]) },
  // CPNS golongan II/III starting pay about Rp 3,2 to 4,5 million a month (PP 15/2019 and PP 5/2024 on PNS salaries); the CPNS age limit is 35.
  { id: 'civil', name: 'Civil service', minAge: 18, steps: ladder([['CPNS trainee', 48_000_000], ['Civil servant', 66_000_000], ['Section head', 96_000_000], ['Division head', 144_000_000]],
    [UPPER, { kind: 'max-age', age: 35, reason: 'The civil service test is open up to age 35.' }]) },
  // A food stall nets about Rp 2,5 million a month; a company much more. Salary is the plan's yearly take at performance 50.
  { id: 'business', name: 'Your own business', minAge: 18, business: true, startCost: 10_000_000, steps: ladder([['Stall owner', 30_000_000], ['Shop owner', 90_000_000], ['Company owner', 240_000_000]], [], false) },
]
