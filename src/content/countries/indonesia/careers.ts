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
// Central Java UMP 2025 Rp 2.169.349 a month. Entry rows come from the checked figures below; higher rungs are game ladders that rise from them.
export const careers: CareerDef[] = [
  // Warung helper Rp 1,5 juta/month part-time, below the BPS average net wage Rp 3,09 juta (Feb 2025, finance.detik.com/berita-ekonomi-bisnis/d-8018512) as part-time work; shop assistant Rp 2,5 juta sits near Central Java UMP 2025 Rp 2.169.349.
  { id: 'shop', name: 'Shop work', minAge: 15, steps: ladder([['Warung helper', 18_000_000, 'part'], ['Shop assistant', 30_000_000], ['Shift supervisor', 45_000_000], ['Store manager', 84_000_000]]) },
  // Office clerk Rp 4 juta/month, ~30% above the BPS national average net wage Rp 3,09 juta (Feb 2025, finance.detik.com/berita-ekonomi-bisnis/d-8018512), in line with city UMPs (Jakarta 2025 Rp 5.396.761).
  { id: 'office', name: 'Office work', minAge: 18, steps: ladder([['Office clerk', 48_000_000], ['Admin officer', 66_000_000], ['Supervisor', 108_000_000], ['Manager', 180_000_000]], [UPPER]) },
  // Honorary teacher Rp 1,5 juta/month fits the IDEAS survey averages of Rp 1,2 juta (SD) to Rp 2,7 juta (SMA) (ekonomi.republika.co.id/berita/sni7sy370); higher rungs are game steps up.
  { id: 'teaching', name: 'Teaching', minAge: 18, steps: ladder([['Honorary teacher', 18_000_000], ['Teacher', 54_000_000], ['Senior teacher', 78_000_000], ['Head teacher', 108_000_000]], [{ kind: 'field', field: 'education', reason: 'Needs a degree in education.' }]) },
  // Nurse Rp 4,5 juta/month, within the Rp 3,5-4,5 juta range in Indeed (avg Rp 4,2 juta; id.indeed.com/salaries/Perawat-Salaries) and LokerID (loker.id/gaji/kesehatan-dan-kedokteran/perawat).
  { id: 'nursing', name: 'Nursing', minAge: 18, steps: ladder([['Nurse', 54_000_000], ['Senior nurse', 78_000_000], ['Head nurse', 108_000_000]], [{ kind: 'field', field: 'health', reason: 'Needs a degree in health.' }]) },
  // Junior developer Rp 5 juta/month matches Payscale 2025 (payscale.com/research/ID/Job=Junior_Software_Engineer/Salary) and Dealls (dealls.com/pengembangan-karir/gaji-programmer); later rungs are game steps up.
  { id: 'software', name: 'Software', minAge: 18, steps: ladder([['Junior developer', 60_000_000], ['Developer', 108_000_000], ['Senior developer', 180_000_000], ['Tech lead', 300_000_000]],
    [UPPER, { kind: 'stat', key: 'smarts', min: 70, reason: 'Needs Smarts 70 or more.', openNote: 'Open to you: Smarts 70+' }]) },
  // Ojek driver Rp 3 juta/month part-time fits ojol net of about Rp 3 juta (SPAI, via CNBC Indonesia: cnbcindonesia.com/tech/20251105044256-37-682328); courier and lead are game steps up.
  { id: 'driving', name: 'Driving', minAge: 17, steps: ladder([['Ojek driver', 36_000_000, 'part'], ['Courier', 48_000_000], ['Delivery team lead', 72_000_000]], [{ kind: 'owns', item: 'motorbike', reason: 'You need a motorbike.' }]) },
  // CPNS take-home about Rp 4 juta/month: gaji pokok II/a from Rp 2.184.000 (PP 5/2024, 80% as CPNS) plus tunjangan kinerja and meal allowances (detik.com/edu/detikpedia/d-7501055); CPNS age limit is 35.
  { id: 'civil', name: 'Civil service', minAge: 18, steps: ladder([['CPNS trainee', 48_000_000], ['Civil servant', 66_000_000], ['Section head', 96_000_000], ['Division head', 144_000_000]],
    [UPPER, { kind: 'max-age', age: 35, reason: 'The civil service test is open up to age 35.' }]) },
  // Business pay is a game formula (see salaryOf) with no single source; the stall base of Rp 2,5 juta/month is a plausible food-stall take, not a surveyed figure.
  { id: 'business', name: 'Your own business', minAge: 18, business: true, startCost: 10_000_000, steps: ladder([['Stall owner', 30_000_000], ['Shop owner', 90_000_000], ['Company owner', 240_000_000]], [], false) },
]
