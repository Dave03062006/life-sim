import type { IllnessDef, Source, TreatmentDef } from '../../types'

// Onset chances are game figures sized to Indonesia; Task 7 tunes them within a factor of two.
// Treatment energy, symptom sizes, weaker effects and costs are game figures too.

const src = (title: string, url: string): Source => ({ title, url })
const care = (id: string, label: string, place: TreatmentDef['place'], cost: number, effect: TreatmentDef['effect'], extra: Partial<TreatmentDef> = {}): TreatmentDef =>
  ({ id, label, place, cost, energy: place === 'hospital' ? 2 : 1, effect, ...extra })

const FLU = src('WHO, Influenza (seasonal) fact sheet', 'https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)')
const DIARRHOEA = src('WHO, Diarrhoeal disease fact sheet', 'https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease')
const DENGUE1 = src('WHO, Dengue and severe dengue fact sheet, 2012 archive', 'https://webarchive.library.unt.edu/web/20121010013248/http://www.who.int/mediacentre/factsheets/fs117/en')
const DENGUE2 = src('WHO EMRO, dengue fact sheet, 2014', 'https://applications.emro.who.int/dsaf/emropub_2014_EN_1629.pdf')
const TYPHOID = src('CDC Yellow Book, Typhoid and Paratyphoid Fever', 'https://www.cdc.gov/yellow-book/hcp/travel-associated-infections-diseases/typhoid-and-paratyphoid-fever.html')
const TB = src('Tiemersma et al., Natural History of Tuberculosis, PLoS ONE, 2011', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3070694/')
const ASTHMA = src('WHO, Asthma fact sheet', 'https://www.who.int/news-room/fact-sheets/detail/asthma')
const BREAST = src('Bloom et al., The natural history of untreated breast cancer (1805-1933), 1962', 'https://pubmed.ncbi.nlm.nih.gov/5220111/')

export const illnesses: IllnessDef[] = [
  {
    id: 'flu', name: 'Influenza', kind: 'short',
    onset: [[0, 0.15]], // game figure
    symptoms: 'A fever, aching all over, and no energy.',
    minigame: { label: 'Flu: everything feels slow', mods: { move: 0.85 } },
    stages: [{ death: 0, symptoms: { health: -3, happiness: -2 }, energy: -1 }],
    untreated: { die: [[65, 0.005], [0, 0.0005]], weaker: 0.05, weakerEffects: { health: -5 } }, // game figure, sized against WHO: 290 000-650 000 deaths a year, mostly over 65
    treated: { die: 0 },
    treatments: [
      care('flu-rest', 'Rest and fluids', 'home', 0, 'ease'),
      care('flu-doctor', 'See a doctor', 'puskesmas', 150000, 'cure'),
    ],
    sources: [FLU],
  },
  {
    id: 'diarrhoea', name: 'Acute diarrhoea', kind: 'short', vaccine: 'vaccinated',
    onset: [[5, 0.08], [0, 0.3]], // game figure
    symptoms: 'Cramps, a dry mouth, and a lot of trips to the toilet.',
    stages: [{ death: 0, symptoms: { health: -4, happiness: -2 }, energy: -1 }],
    untreated: { die: [[5, 0.001], [0, 0.01]] }, // game figure, sized against WHO: about 443 832 under-5 deaths a year
    treated: { die: 0 }, // WHO: oral rehydration and zinc prevent most deaths
    treatments: [care('diarrhoea-ors', 'Oral rehydration', 'home', 10000, 'cure')],
    sources: [DIARRHOEA],
  },
  {
    id: 'dengue', name: 'Dengue fever', kind: 'short',
    onset: [[0, 0.01]], // game figure
    symptoms: 'A high fever, a pounding headache, and pain behind the eyes.',
    minigame: { label: 'Dengue fever: your aim wobbles', mods: { wobble: 1 } },
    stages: [{ death: 0, symptoms: { health: -8, happiness: -3 }, energy: -2 }],
    untreated: { die: [[0, 0.02]], weaker: 0.2, weakerEffects: { health: -8 } }, // game figure, sized against sources [1][2]: severe dengue above 20% fatal without care
    treated: { die: 0.001 }, // sources [1][2]: below 1% with proper care
    treatments: [care('dengue-hospital', 'Hospital care', 'hospital', 5000000, 'cure')],
    sources: [DENGUE1, DENGUE2],
  },
  {
    id: 'typhoid', name: 'Typhoid fever', kind: 'short',
    onset: [[31, 0.001], [5, 0.005], [0, 0.001]], // game figure
    symptoms: 'A fever that climbs every day, a sore stomach, and weakness.',
    stages: [{ death: 0, symptoms: { health: -6, happiness: -2 }, energy: -1 }],
    untreated: { die: [[0, 0.15]], weaker: 0.3, weakerEffects: { health: -6 } }, // CDC Yellow Book: 10-30% untreated (weaker is a game figure)
    treated: { die: 0.005 }, // CDC Yellow Book: below 1% treated
    treatments: [care('typhoid-antibiotics', 'Antibiotics', 'puskesmas', 300000, 'cure')],
    sources: [TYPHOID],
  },
  {
    id: 'pneumonia', name: 'Pneumonia', kind: 'short', vaccine: 'vaccinated',
    onset: [[65, 0.02], [5, 0.003], [0, 0.02]], // game figure
    symptoms: 'A wet cough, a fever, and it hurts to breathe.',
    minigame: { label: 'Pneumonia: you run out of breath', mods: { drain: 1.3 } },
    stages: [{ death: 0, symptoms: { health: -8, happiness: -3 }, energy: -2 }],
    untreated: { die: [[30, 0.3], [0, 0.12]] }, // PMC2827629: about 12% under 30 and 32% at 30-59 before antibiotics; JCI: about 30-40% overall
    treated: { die: 0.05 }, // PMC2827629: about 5% with penicillin
    treatments: [
      care('pneumonia-antibiotics', 'Antibiotics', 'puskesmas', 300000, 'cure'),
      care('pneumonia-hospital', 'Hospital', 'hospital', 8000000, 'cure'),
    ],
    sources: [
      src('Pre-antibiotic pneumonia mortality, JCI historical review', 'https://www.jci.org/articles/view/29920'),
      src('Pneumonia case fatality by age, before and after penicillin', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2827629/'),
    ],
  },
  {
    id: 'appendicitis', name: 'Appendicitis', kind: 'short',
    onset: [[31, 0.0005], [10, 0.002], [0, 0.0005]], // game figure
    symptoms: 'A pain that starts around the belly button and moves to the lower right.',
    stages: [{ death: 0, symptoms: { health: -10, happiness: -3 }, energy: -2 }],
    untreated: { die: [[0, 0.5]] }, // game estimate: no direct untreated series; perforation makes death about six times likelier even with surgery (PMC1421275)
    treated: { die: 0.003 }, // PMC1421275: 0.12% died non-perforated, 1.18% perforated, 9 652 cases
    treatments: [care('appendicitis-surgery', 'Surgery', 'hospital', 15000000, 'cure', { line: 'You had your appendix out. The hospital food was the worst part.' })],
    sources: [src('Appendicitis mortality in 9 652 cases', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1421275/')],
  },
  {
    id: 'tb', name: 'Tuberculosis', kind: 'long',
    onset: [[56, 0.001], [15, 0.003], [0, 0.001]], // game figure
    symptoms: 'A cough that will not quit, and you are tired all the time.',
    stages: [{ death: 0.18, recover: 0.08, symptoms: { health: -5 }, energy: -1 }], // Tiemersma 2011: about 70% of smear-positive cases die within 10 years; these rates give about 66% by year 10
    treated: { die: 0.01 }, // game figure
    treatments: [care('tb-course', 'Six-month TB treatment', 'puskesmas', 0, 'cure', { line: 'Six months of pills, every day. It worked.' })], // free under the national programme
    sources: [TB],
  },
  {
    id: 'asthma', name: 'Asthma', kind: 'long',
    onset: [[16, 0.0005], [3, 0.004], [0, 0.0005]], // game figure
    symptoms: 'Wheezing, a tight chest, and attacks that leave you breathless.',
    minigame: { label: 'Asthma: you run out of breath', mods: { drain: 1.3 } },
    stages: [{ death: 0.002, symptoms: { stress: 3 }, energy: -1 }], // game figure, sized against WHO: 455 000 deaths among 262 million people in 2019
    treated: { die: 0.0002 }, // game figure
    treatments: [care('asthma-inhaler', 'Inhaler', 'puskesmas', 200000, 'control')],
    sources: [ASTHMA],
  },
  {
    id: 'high-bp', name: 'High blood pressure', kind: 'long',
    onset: [[35, 0.02]], // game figure
    symptoms: 'Headaches and a pounding pulse, though many feel nothing at all.',
    stages: [{ death: 0.003, silent: true }], // game figure, sized against Franco 2005: about 5 years of life lost at 50
    treated: { die: 0.001 }, // game figure
    treatments: [care('bp-medicine', 'Daily medicine', 'puskesmas', 600000, 'control')],
    sources: [src('Franco et al., Blood pressure in adulthood and life expectancy, Hypertension, 2005', 'https://pubmed.ncbi.nlm.nih.gov/15983235/')],
  },
  {
    id: 'diabetes', name: 'Type 2 diabetes', kind: 'long',
    onset: [[35, 0.008]], // game figure
    risk: { lowHealth: 2 },
    symptoms: 'Constant thirst, tiredness, and cuts that heal slowly.',
    stages: [
      { death: 0.005, silent: true }, // game figure, sized against ERFC 2023: diagnosis at 50 costs about 6 years
      { death: 0.015, symptoms: { health: -3 }, energy: -1 }, // game figure
    ],
    treated: { die: 0.004 }, // game figure
    treatments: [care('diabetes-care', 'Medicine and diet', 'puskesmas', 1200000, 'control')],
    sources: [src('Emerging Risk Factors Collaboration, life expectancy and age at diagnosis of type 2 diabetes, 2023 (summary)', 'https://www.nursinginpractice.com/?p=33584')],
  },
  {
    id: 'heart-attack', name: 'Heart attack', kind: 'short',
    onset: [[45, 0.003]], // game figure
    risk: { untreated: { 'high-bp': 2, diabetes: 2 } },
    symptoms: 'A crushing pain in the chest, a cold sweat, and fear.',
    stages: [{ death: 0, symptoms: { health: -10, happiness: -4 }, energy: -3 }],
    untreated: { die: [[0, 0.3]], weaker: 0.5, weakerEffects: { health: -10 } }, // ACC: early hospital mortality about 30% before coronary care units (weaker is a game figure)
    treated: { die: 0.08 }, // ACC: about 15% with early coronary care; game figure for modern care
    treatments: [care('heart-hospital', 'Hospital', 'hospital', 50000000, 'cure')],
    sources: [src('ACC, The King of Hollywood and 60 Years of the Coronary Care Unit', 'https://www.acc.org/Latest-in-Cardiology/Articles/2021/07/01/01/42/Editors-Corner-The-King-of-Hollywood-and-60-Years-of-the-Coronary-Care-Unit')],
  },
  {
    id: 'stroke', name: 'Stroke', kind: 'short',
    onset: [[50, 0.003]], // game figure
    risk: { untreated: { 'high-bp': 2 } },
    symptoms: 'A drooping face, slurred words, and an arm that will not lift.',
    stages: [{ death: 0, symptoms: { health: -8, smarts: -5 }, energy: -3 }],
    untreated: { die: [[0, 0.25]], weaker: 0.5, weakerEffects: { health: -8, smarts: -5 } }, // Ackah 2024: 27% 30-day case fatality, sub-Saharan Africa (weaker is a game figure)
    treated: { die: 0.15 }, // game figure: lower with fast care
    treatments: [care('stroke-hospital', 'Hospital', 'hospital', 30000000, 'cure')],
    sources: [src('Ackah et al., stroke case fatality in sub-Saharan Africa, 2024', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10798456/')],
  },
  {
    id: 'lung-cancer', name: 'Lung cancer', kind: 'long',
    onset: [[50, 0.0008]], // game figure
    symptoms: 'A cough with blood, a sore chest, and losing weight.',
    stages: [
      { death: 0.2, silent: true }, // game figure, sized against Wao 2013: pooled untreated survival about 7 months
      { death: 0.7, symptoms: { health: -10 }, energy: -2 }, // game figure
      { death: 0.9, symptoms: { health: -10 }, energy: -2 }, // game figure
    ],
    treated: { die: 0.3 }, // game figure
    treatments: [
      care('lung-surgery', 'Surgery when caught early', 'hospital', 150000000, 'cure', { stages: [0] }),
      care('lung-treatment', 'Treatment to slow it', 'hospital', 60000000, 'control'),
    ],
    sources: [src('Wao et al., survival of untreated lung cancer, 2013', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3579762/')],
  },
  {
    id: 'breast-cancer', name: 'Breast cancer', kind: 'long', gender: 'female',
    onset: [[35, 0.001]], // game figure
    symptoms: 'A lump that was not there before.',
    stages: [
      { death: 0.1, silent: true }, // game figure
      { death: 0.27, symptoms: { health: -5 } }, // Bloom 1962: a yearly 0.27 gives 21% alive at 5 years and 4% at 10
    ],
    treated: { die: 0.08 }, // game figure: most survive when caught early
    treatments: [
      care('breast-surgery', 'Surgery when caught early', 'hospital', 80000000, 'cure', { stages: [0] }),
      care('breast-treatment', 'Ongoing treatment', 'hospital', 40000000, 'control'),
    ],
    sources: [BREAST],
  },
]
