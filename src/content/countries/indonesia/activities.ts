import type { CategoryId, StageId, StatKey } from '../../../life/types'
import type { ActivityDef, MinigameType, Requirement } from '../../types'

type Fx = Partial<Record<StatKey, number>>
type Extra = Partial<Pick<ActivityDef, 'energyBack' | 'rest' | 'requires' | 'failPenalty' | 'lines' | 'with' | 'together' | 'makes' | 'stages' | 'track' | 'sets' | 'performance' | 'buys'>>

const FAIL: Partial<Record<CategoryId, Fx>> = {
  body: { health: -3 },
  school: { happiness: -2, stress: 2 },
  mind: { happiness: -2, stress: 2 },
  people: { happiness: -3 },
  money: { reputation: -2 },
  fun: { happiness: -2 },
}

const stat = (key: StatKey, name: string): Requirement => ({
  kind: 'stat',
  key,
  min: 60,
  reason: `Needs ${name} 60 or more.`,
  openNote: `Open to you: ${name} 60+`,
})

// game is the mini-game type; its theme is the id. A game gets its category's fail penalty unless extra overrides it.
function a(
  id: string, category: CategoryId, title: string, description: string,
  game: MinigameType | '', energy: number, money: number, effects: Fx, lines: string, extra: Extra = {},
): ActivityDef {
  const def: ActivityDef = { id, category, title, description, icon: `act-${id}`, stages: ['late-teen'], energy, effects, lines, ...extra }
  if (money) def.money = money
  if (game) {
    def.minigame = { type: game, theme: id }
    def.failPenalty = extra.failPenalty ?? FAIL[category]
  }
  return def
}

const B: StageId = 'baby', SC: StageId = 'small-child', CH: StageId = 'child', ET: StageId = 'early-teen', LT: StageId = 'late-teen'
const YA: StageId = 'young-adult', AD: StageId = 'adult', SE: StageId = 'senior'
const JOB: Requirement = { kind: 'job', reason: "You don't have a job. Try the job board." }
const WORK: StageId[] = [LT, YA, AD, SE]
const CH_UP = [CH, ET, LT, YA, AD, SE], ET_UP = [ET, LT, YA, AD, SE], GROWN = [YA, AD, SE]

// The original late-teen activities, unchanged in text, and the other ages that fit them.
export const wider: Record<string, StageId[]> = {
  homework: [CH, ET, LT], 'group-project': [CH, ET, LT], 'skip-class': [ET, LT],
  library: CH_UP, english: CH_UP, chess: CH_UP, diary: CH_UP, 'puzzle-cube': CH_UP, code: ET_UP,
  futsal: [CH, ET, LT, YA, AD], jog: CH_UP, gym: [LT, YA, AD, SE], badminton: CH_UP, swim: CH_UP, silat: CH_UP,
  checkup: ET_UP, dentist: [SC, ...CH_UP], 'eat-better': CH_UP, counsellor: [ET, LT],
  cook: [SC, ...CH_UP], 'family-dinner': [B, SC, ...CH_UP], 'call-nenek': [SC, ...CH_UP], 'new-friend': CH_UP,
  'sell-snacks': [CH, ET, LT], tutor: [LT, YA, AD, SE], 'save-bank': CH_UP, motorbike: [LT, YA, AD, SE], 'join-bpjs': GROWN, clothes: ET_UP, 'warung-shift': [LT, YA, AD],
  band: ET_UP, warnet: [ET, LT, YA], film: CH_UP, karaoke: ET_UP, 'ride-town': ET_UP, comics: CH_UP,
  nap: [B, SC, ...CH_UP], 'sleep-in': CH_UP, meditate: ET_UP, pijat: GROWN, holiday: CH_UP, 'do-nothing': CH_UP,
}

const base: ActivityDef[] = [
  a('study-exam', 'school', 'Study for the exam', 'Hit the books before semester exams. Builds Smarts.', 'quiz', 2, 0, { smarts: 5, stress: 3 }, 'You studied hard for the semester exam.', { track: 'enrolled' }),
  a('homework', 'school', 'Do your homework', 'Keep up with assignments. A little Smarts and a calmer head.', 'typing', 1, 0, { smarts: 2, stress: -1 }, 'You handed in your homework on time, for once.', { track: 'enrolled' }),
  a('osis', 'school', 'Run for OSIS', 'Campaign for a seat on the student council.', 'tapping', 2, 0, { reputation: 6, stress: 2 }, 'You campaigned for a seat on OSIS.', { requires: [stat('reputation', 'Reputation')], track: 'enrolled' }),
  a('group-project', 'school', 'Group project', 'Build a science poster with classmates. Smarts and friendships.', 'memory', 2, 0, { smarts: 3, happiness: 2 }, 'Your group finished the science project.', { track: 'enrolled' }),
  a('bimbel', 'school', 'Bimbel after school', 'Paid tutoring for the university entrance test. Big Smarts.', 'quiz', 2, -250000, { smarts: 8, stress: 4 }, 'You went to bimbel three evenings a week.', { track: 'enrolled' }),
  a('skip-class', 'school', 'Skip class', 'Slip out early. You get an hour back, and you might get caught.', 'timing', 0, 0, { happiness: 3, reputation: -3, smarts: -1 }, 'You skipped class. A teacher saw you at the gate.', { energyBack: 1, track: 'enrolled' }),
  a('entrance-test', 'school', 'Take the entrance test', 'The university entrance exam, ten questions. Pass it to apply for a place.', 'quiz', 3, 0, { smarts: 2 }, 'You sat the entrance test and walked out with a headache.', {
    stages: [LT, YA, AD, SE], sets: 'passed-entrance',
    requires: [{ kind: 'min-age', age: 17, reason: 'From age 17.' }, { kind: 'school', levels: ['sma', 'smk', 'paket-c'], reason: 'Needs SMA, SMK or Paket C.' }],
  }),
  a('library', 'mind', 'Read at the library', 'Novels and history books from the city library.', 'memory', 1, 0, { smarts: 3, stress: -1 }, 'You spent quiet afternoons at the city library.'),
  a('english', 'mind', 'Practise English', 'Podcasts and subtitles. Opens better jobs later.', 'typing', 1, 0, { smarts: 3 }, 'Your English got noticeably better.'),
  a('code', 'mind', 'Learn to code', 'Free tutorials on an old laptop. Smarts, and a way into tech.', 'typing', 2, 0, { smarts: 5, stress: 2 }, 'You wrote your first working program.'),
  a('chess', 'mind', 'Chess club', 'Play the seniors after school. Smarts and patience.', 'memory', 1, 0, { smarts: 2, reputation: 1 }, 'You won two games at chess club.'),
  a('diary', 'mind', 'Write in your diary', 'Get the year out of your head. Lowers Stress.', 'typing', 1, 0, { stress: -5, happiness: 1 }, 'You wrote it all down in your diary.'),
  a('puzzle-cube', 'mind', 'Solve puzzle cubes', 'Learn the moves, chase a faster time.', 'timing', 1, 0, { smarts: 2, happiness: 1 }, 'You solved the cube in under a minute.'),
  a('futsal', 'body', 'Futsal practice', 'Shooting drills with the school team. Health and Looks.', 'timing', 2, 0, { health: 4, looks: 1, stress: -2 }, '', {
    failPenalty: { health: -3, happiness: -2 },
    lines: {
      fail: 'Futsal practice: you shot wide and pulled a muscle.',
      weak: 'Futsal practice: the keeper got a hand to it.',
      good: 'Futsal practice: you scored.',
      great: 'Futsal practice: a perfect strike into the top corner.',
    },
  }),
  a('jog', 'body', 'Morning jog', 'Laps around the neighbourhood before school.', 'tapping', 1, 0, { health: 3, stress: -2 }, 'You jogged most mornings.'),
  a('gym', 'body', 'Gym session', 'Weights at the gym near the market. Health and Looks.', 'tapping', 2, -30000, { health: 4, looks: 3 }, 'You lifted weights at the gym.'),
  a('badminton', 'body', 'Badminton', 'Doubles at the community hall. Health and good company.', 'timing', 2, 0, { health: 3, happiness: 2 }, 'You played badminton at the community hall.'),
  a('swim', 'body', 'Swim laps', 'The public pool on Sunday morning.', 'tapping', 2, -15000, { health: 4, stress: -2 }, 'You swam laps at the public pool.'),
  a('silat', 'body', 'Pencak silat class', 'Learn the forms. Health and Reputation.', 'memory', 2, 0, { health: 3, reputation: 2 }, 'You learned new pencak silat forms.'),
  a('checkup', 'health', 'Health check-up', 'A check at the puskesmas. Finds hidden illness early.', '', 1, -25000, { stress: -1 }, 'Your check-up found nothing new.'),
  a('dentist', 'health', 'See the dentist', 'A cleaning and a filling. Health and Looks.', '', 1, -120000, { health: 2, looks: 2 }, 'The dentist fixed a cavity.'),
  a('eat-better', 'health', 'Eat better this year', 'More vegetables, less fried food. Slow, steady Health.', 'catch', 1, 0, { health: 4, happiness: -1 }, 'You ate better this year. You miss gorengan.', { failPenalty: { happiness: -2 } }),
  a('counsellor', 'health', 'Talk to the counsellor', 'The school counsellor listens. Lowers Stress a lot.', '', 1, 0, { stress: -8, happiness: 2 }, 'You talked things through with the school counsellor.'),
  a('cook', 'people', 'Help Ibu cook', 'Chop, stir, taste. Time with your mother.', 'catch', 1, 0, { happiness: 2, stress: -1 }, 'You helped Ibu cook dinner.', { with: 'mother' }),
  a('family-dinner', 'people', 'Family dinner', 'Everyone at the table, for once.', '', 1, 0, { happiness: 3 }, 'The whole family ate dinner together.', { together: ['mother', 'father', 'sibling'] }),
  a('call-nenek', 'people', 'Call Nenek', 'Your grandmother loves hearing from you.', '', 0, 0, { happiness: 2 }, 'You called Nenek. She talked for an hour.', { with: 'grandparent' }),
  a('new-friend', 'people', 'Make a new friend', 'Talk to someone outside your circle.', 'quiz', 1, 0, { reputation: 3, happiness: 2 }, '', {
    makes: 'friend',
    lines: {
      fail: 'You tried to make a new friend. The conversation died on the spot.',
      weak: 'You chatted with someone new. It did not quite click.',
      good: 'You made a new friend: {name}.',
      great: 'You made a new friend: {name}.',
    },
  }),
  a('warung-shift', 'money', 'Shift at the warung', 'Serve customers at Bu Yanti’s food stall.', 'memory', 2, 60000, { stress: 2 }, 'You worked shifts at the warung.'),
  a('sell-snacks', 'money', 'Sell snacks at school', 'Buy kue in bulk and sell it at break time.', 'quiz', 1, 35000, { reputation: 1 }, 'You sold snacks at break time.'),
  a('tutor', 'money', 'Tutor a neighbour’s kid', 'Teach maths to a primary-school kid.', 'quiz', 2, 75000, { smarts: 1, reputation: 1 }, 'You tutored a neighbour’s kid in maths.', { requires: [stat('smarts', 'Smarts')] }),
  a('save-bank', 'money', 'Save at the bank', 'Put money away. It earns a little interest each year.', '', 0, 0, {}, 'You opened a savings account.', { sets: 'bank', requires: [{ kind: 'no-flag', flag: 'bank', reason: 'You already have a savings account.' }] }),
  a('clothes', 'money', 'Buy new clothes', 'A sharper look for school and weekends.', '', 0, -180000, { looks: 5, happiness: 2 }, 'You bought new clothes.'),
  a('motorbike', 'money', 'Buy a motorbike', 'A second-hand scooter means freedom.', '', 0, -8000000, { happiness: 8, reputation: 3 }, 'You bought a second-hand scooter.', {
    buys: 'motorbike',
    requires: [{ kind: 'min-age', age: 17, reason: 'From age 17, with a SIM C licence' }],
  }),
  // Prices and sources: see belongings.ts
  a('buy-car', 'money', 'Buy a car', 'A second-hand family car. Roomier, and the rain stops mattering.', '', 0, -150000000, { happiness: 6, reputation: 4 }, 'You bought a second-hand car.', {
    stages: GROWN, buys: 'car', requires: [{ kind: 'min-age', age: 17, reason: 'From age 17, with a SIM A licence.' }],
  }),
  a('buy-house', 'money', 'Buy a starter house', 'A small subsidised house on the edge of town. No more rent, no more landlord.', '', 0, -185000000, { happiness: 8, stress: -4 }, 'You bought a house and got the keys.', { stages: GROWN, buys: 'house' }),
  a('join-bpjs', 'health', 'Join BPJS Kesehatan', 'Kelas 3 health insurance, paid every year. Treatment discounts come later.', '', 0, 0, {}, 'You signed up for BPJS Kesehatan.', {
    sets: 'bpjs', requires: [{ kind: 'min-age', age: 18, reason: 'From age 18.' }, { kind: 'no-flag', flag: 'bpjs', reason: 'You are already in BPJS.' }],
  }),
  a('band', 'fun', 'Band rehearsal', 'Guitar with your school band. Happiness and Reputation.', 'tapping', 2, 0, { happiness: 5, reputation: 2 }, 'Your band finally nailed the chorus.'),
  a('warnet', 'fun', 'Games at the warnet', 'A few hours at the internet café.', 'tapping', 1, -10000, { happiness: 4, stress: -3, smarts: -1 }, 'You lost an evening at the warnet.'),
  a('film', 'fun', 'Watch a film', 'The new release at the bioskop, with popcorn.', '', 1, -45000, { happiness: 4, stress: -2 }, 'You watched a film at the bioskop.'),
  a('karaoke', 'fun', 'Karaoke night', 'Sing badly, laugh a lot.', 'timing', 1, -30000, { happiness: 5, stress: -2 }, 'You sang yourself hoarse at karaoke.'),
  a('ride-town', 'fun', 'Ride around town', 'Take the angkot to the mall and back, just because.', '', 1, -8000, { happiness: 3 }, 'You rode around town with no plan at all.'),
  a('comics', 'fun', 'Draw comics', 'Fill a sketchbook with your own characters.', 'memory', 1, 0, { happiness: 3, smarts: 1 }, 'You filled half a sketchbook with comics.'),
  a('sleep-in', 'rest', 'Sleep in', 'A slow Sunday morning.', '', 0, 0, { stress: -3 }, 'You slept in.', { rest: 3 }),
  a('nap', 'rest', 'Afternoon nap', 'An hour in the hammock.', '', 0, 0, { stress: -2 }, 'You napped through the afternoon heat.', { rest: 2 }),
  a('meditate', 'rest', 'Meditate', 'Ten quiet minutes a day.', 'timing', 0, 0, { stress: -6 }, 'You meditated most evenings.', { rest: 2, failPenalty: { stress: 2 } }),
  a('pijat', 'rest', 'Get a pijat', 'A proper massage for sore muscles.', '', 0, -80000, { health: 2, stress: -4 }, 'You got a pijat. Everything stopped hurting.', { rest: 4 }),
  a('holiday', 'rest', 'Holiday at Nenek’s village', 'A week away from the city.', '', 0, -300000, { happiness: 5, stress: -8 }, 'You spent a week in Nenek’s village.', { rest: 5 }),
  a('do-nothing', 'rest', 'Do nothing at home', 'TV, snacks, sofa.', '', 0, 0, { happiness: 1, smarts: -1 }, 'You did absolutely nothing for a while.', { rest: 2 }),
  // Babies
  a('smile-ibu', 'people', 'Smile at Ibu', 'Your mother melts every time.', '', 1, 0, { happiness: 2 }, 'You smiled at Ibu. She told everyone.', { stages: [B] }),
  a('first-words', 'people', 'Say your first words', 'Mama, papa, or maybe just “nenen”.', '', 1, 0, { smarts: 2, happiness: 1 }, 'You said “mama”. Your mother cried a little.', { stages: [B], requires: [{ kind: 'min-age', age: 1, reason: 'From age 1.' }] }),
  a('cry-attention', 'people', 'Cry for attention', 'It works every single time.', '', 1, 0, { happiness: 1, stress: 1 }, 'You cried at midnight. Your parents took turns holding you.', { stages: [B] }),
  a('rattle', 'fun', 'Shake a rattle', 'Noise! Wonderful noise!', '', 1, 0, { happiness: 2 }, 'You shook the rattle until your father asked for a break.', { stages: [B, SC] }),
  a('splash', 'fun', 'Splash at bath time', 'The water is warm and the duck floats.', '', 1, 0, { happiness: 2, health: 1 }, 'You splashed the whole bathroom at bath time.', { stages: [B, SC] }),
  a('crawl', 'fun', 'Learn to crawl', 'Slowly, then suddenly everywhere.', '', 1, 0, { health: 2, happiness: 1 }, 'You crawled across the floor. Nothing was safe after that.', { stages: [B], requires: [{ kind: 'min-age', age: 1, reason: 'From age 1.' }] }),
  a('posyandu', 'health', 'Posyandu weigh-in', 'The village health post weighs you and checks your growth.', '', 1, 0, { health: 2 }, 'The posyandu nurse said you are growing well.', { stages: [B, SC] }),
  a('immunisation', 'health', 'Get your shots', 'A little needle and a lot of crying.', '', 1, 0, { health: 3, happiness: -1 }, 'You got your shots and cried. Then you got a sticker.', { stages: [B, SC, CH], sets: 'vaccinated' }),
  a('lullaby', 'rest', 'Fall asleep to a lullaby', 'Ibu hums until your eyes close.', '', 0, 0, { stress: -2 }, 'You fell asleep to a lullaby.', { stages: [B, SC], rest: 2 }),
  // Small children
  a('letters', 'mind', 'Learn your letters', 'A, B, C and a very long song.', '', 1, 0, { smarts: 2 }, 'You learned your letters and sang them to the cat.', { stages: [SC] }),
  a('picture-book', 'mind', 'Look at picture books', 'Big pictures and a lap to sit in.', '', 1, 0, { smarts: 2, happiness: 1 }, 'You looked at picture books until bedtime.', { stages: [SC] }),
  a('share-toys', 'people', 'Share your toys', 'It is harder than it sounds.', '', 1, 0, { happiness: 2, reputation: 1 }, 'You shared your toys. Mostly.', { stages: [SC, CH] }),
  a('crayons', 'fun', 'Draw with crayons', 'The wall is also paper, right?', '', 1, 0, { happiness: 3, smarts: 1 }, 'You drew a very large cat. It is on the wall now.', { stages: [SC] }),
  a('pretend-play', 'fun', 'Play pretend', 'Today you are a pilot. Tomorrow, a chef.', '', 1, 0, { happiness: 3 }, 'You played pretend until dinner.', { stages: [SC, CH] }),
  a('play-outside', 'fun', 'Play outside', 'Marbles, tag and muddy knees.', '', 1, 0, { happiness: 3, health: 1 }, 'You played outside until the call to come in.', { stages: [SC, CH] }),
  a('brush-teeth', 'health', 'Brush your teeth', 'Two minutes, morning and night.', '', 1, 0, { health: 2, looks: 1 }, 'You brushed your teeth without being asked. Once.', { stages: [SC, CH] }),
  // Children and early teens
  a('class-test', 'school', 'Study for the class test', 'Revise the basics before the ulangan.', 'quiz', 2, 0, { smarts: 4, stress: 2 }, 'You studied for the class test.', { stages: [CH, ET], track: 'enrolled' }),
  a('read-ahead', 'school', 'Read ahead', 'Peek at next week’s chapter.', 'memory', 1, 0, { smarts: 2 }, 'You read ahead and felt very clever.', { stages: [CH, ET], track: 'enrolled' }),
  a('uks', 'health', 'Visit the school health room', 'A plaster, a rest and a cup of tea.', '', 1, 0, { health: 2, stress: -1 }, 'You visited the UKS and lay down for a while.', { stages: [CH, ET, LT] }),
  // Grown-ups
  a('evening-class', 'school', 'Take an evening class', 'Learn something new after work.', 'memory', 2, 0, { smarts: 3, stress: 1 }, 'You went to an evening class and kept up.', { stages: GROWN }),
  a('workshop', 'school', 'Go to a workshop', 'A weekend course with a certificate at the end.', '', 1, -50000, { smarts: 3, reputation: 1 }, 'You went to a weekend workshop and got a certificate.', { stages: GROWN }),
  a('hobby-class', 'mind', 'Join a batik class', 'Wax, dye and patience.', 'memory', 1, 0, { happiness: 3, smarts: 1 }, 'You made a batik cloth. It is only a little crooked.', { stages: GROWN }),
  a('gardening', 'body', 'Do some gardening', 'Chillies, spinach and a stubborn mango tree.', 'tapping', 1, 0, { health: 1, stress: -2 }, 'You spent the morning in the garden.', { stages: GROWN }),
  a('morning-walk', 'body', 'Take a morning walk', 'A slow loop before the heat.', '', 1, 0, { health: 1, stress: -1 }, 'You took a slow walk around the neighbourhood.', { stages: [AD, SE] }),
  a('senam', 'body', 'Join senam class', 'Gentle exercise to music, with the neighbours.', 'timing', 1, 0, { health: 1, happiness: 2 }, 'You joined the senam class and kept the beat.', { stages: [AD, SE] }),
  a('neighbour-chat', 'people', 'Chat with the neighbours', 'Tea on the porch and the latest news.', '', 1, 0, { happiness: 2, reputation: 1 }, 'You chatted with the neighbours on the porch.', { stages: GROWN }),
  a('call-relative', 'people', 'Call a relative far away', 'A long call about nothing and everything.', '', 0, 0, { happiness: 2 }, 'You called a relative far away. The call ran an hour.', { stages: [AD, SE] }),
  a('side-gig', 'money', 'Take a side gig', 'Weekend work for a little extra.', 'tapping', 2, 90000, { stress: 2 }, 'You took a side gig on the weekend.', { stages: [YA, AD] }),
  a('sell-garden', 'money', 'Sell garden produce', 'Chillies and spinach at the morning market.', '', 1, 40000, { reputation: 1 }, 'You sold your chillies at the morning market.', { stages: [AD, SE] }),
  // Work: shown from 15 once you have left school, and open only with a job
  a('extra-hours', 'school', 'Work extra hours', 'Stay late and finish what the day left behind.', 'tapping', 2, 0, { stress: 3 }, 'You stayed late and cleared the pile.', { stages: WORK, track: 'work', performance: 8, requires: [JOB] }),
  a('help-colleague', 'school', 'Help a colleague', 'Lend a hand with something that is not your job.', 'memory', 1, 0, { reputation: 2 }, 'You helped a colleague, and they will remember it.', { stages: WORK, track: 'work', performance: 4, requires: [JOB] }),
  a('pitch-idea', 'school', 'Pitch an idea', 'Bring a better way of doing things to the boss.', 'quiz', 2, 0, {}, 'You pitched your idea and the boss wrote it down.', { stages: WORK, track: 'work', performance: 10, requires: [JOB, stat('smarts', 'Smarts')] }),
  a('clear-inbox', 'school', 'Clear the inbox', 'Answer the messages that have been waiting all week.', 'typing', 1, 0, { stress: -1 }, 'You cleared the inbox, almost to zero.', { stages: WORK, track: 'work', performance: 4, requires: [JOB] }),
  a('team-lunch', 'school', 'Join the team lunch', 'Nasi campur with the people you work with.', '', 1, -50000, { happiness: 2, reputation: 2 }, 'You went to the team lunch and heard all the gossip.', { stages: WORK, track: 'work', requires: [JOB] }),
  a('slack-off', 'school', 'Slack off', 'Disappear for an hour. It is a risk, and the boss notices.', 'timing', 0, 0, { happiness: 2 }, 'You slipped out for an hour. Somebody noticed.', { stages: WORK, track: 'work', performance: -5, energyBack: 1, requires: [JOB] }),
]

export const activities: ActivityDef[] = base.map((d) => (wider[d.id] ? { ...d, stages: wider[d.id]! } : d))
