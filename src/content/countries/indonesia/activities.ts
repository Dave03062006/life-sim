import type { CategoryId, StatKey } from '../../../life/types'
import type { ActivityDef, MinigameType, Requirement } from '../../types'

type Fx = Partial<Record<StatKey, number>>
type Extra = Partial<Pick<ActivityDef, 'energyBack' | 'rest' | 'requires' | 'failPenalty' | 'lines'>>

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

export const activities: ActivityDef[] = [
  a('study-exam', 'school', 'Study for the exam', 'Hit the books before semester exams. Builds Smarts.', 'quiz', 2, 0, { smarts: 5, stress: 3 }, 'You studied hard for the semester exam.'),
  a('homework', 'school', 'Do your homework', 'Keep up with assignments. A little Smarts and a calmer head.', 'typing', 1, 0, { smarts: 2, stress: -1 }, 'You handed in your homework on time, for once.'),
  a('osis', 'school', 'Run for OSIS', 'Campaign for a seat on the student council.', 'tapping', 2, 0, { reputation: 6, stress: 2 }, 'You campaigned for a seat on OSIS.', { requires: [stat('reputation', 'Reputation')] }),
  a('group-project', 'school', 'Group project', 'Build a science poster with classmates. Smarts and friendships.', 'memory', 2, 0, { smarts: 3, happiness: 2 }, 'Your group finished the science project.'),
  a('bimbel', 'school', 'Bimbel after school', 'Paid tutoring for the university entrance test. Big Smarts.', 'quiz', 2, -250000, { smarts: 8, stress: 4 }, 'You went to bimbel three evenings a week.'),
  a('skip-class', 'school', 'Skip class', 'Slip out early. You get an hour back, and you might get caught.', 'timing', 0, 0, { happiness: 3, reputation: -3, smarts: -1 }, 'You skipped class. A teacher saw you at the gate.', { energyBack: 1 }),
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
  a('hang-out', 'people', 'Hang out with Dimas', 'Your best friend since SMP.', 'tapping', 1, 0, { happiness: 4, stress: -2 }, 'You and Dimas wasted a perfect afternoon together.'),
  a('cook', 'people', 'Help Ibu cook', 'Chop, stir, taste. Time with your mother.', 'catch', 1, 0, { happiness: 2, stress: -1 }, 'You helped Ibu cook dinner.'),
  a('family-dinner', 'people', 'Family dinner', 'Everyone at the table, for once.', '', 1, 0, { happiness: 3 }, 'The whole family ate dinner together.'),
  a('call-nenek', 'people', 'Call Nenek', 'Your grandmother loves hearing from you.', '', 0, 0, { happiness: 2 }, 'You called Nenek. She talked for an hour.'),
  a('new-friend', 'people', 'Make a new friend', 'Talk to someone outside your circle.', 'quiz', 1, 0, { reputation: 3, happiness: 2 }, 'You made a new friend: Sari from kelas 11 IPA 2.'),
  a('crush', 'people', 'Confess to your crush', 'Tell Putri how you feel. It could go either way.', 'timing', 1, 0, { happiness: 5, stress: 3 }, 'You told Putri how you feel. She smiled.'),
  a('warung-shift', 'money', 'Shift at the warung', 'Serve customers at Bu Yanti’s food stall.', 'memory', 2, 60000, { stress: 2 }, 'You worked shifts at the warung.'),
  a('sell-snacks', 'money', 'Sell snacks at school', 'Buy kue in bulk and sell it at break time.', 'quiz', 1, 35000, { reputation: 1 }, 'You sold snacks at break time.'),
  a('tutor', 'money', 'Tutor a neighbour’s kid', 'Teach maths to a primary-school kid.', 'quiz', 2, 75000, { smarts: 1, reputation: 1 }, 'You tutored a neighbour’s kid in maths.', { requires: [stat('smarts', 'Smarts')] }),
  a('save-bank', 'money', 'Save at the bank', 'Put money away. It earns a little interest each year.', '', 0, 0, {}, 'You opened a savings account.'),
  a('clothes', 'money', 'Buy new clothes', 'A sharper look for school and weekends.', '', 0, -180000, { looks: 5, happiness: 2 }, 'You bought new clothes.'),
  a('motorbike', 'money', 'Buy a motorbike', 'A second-hand scooter means freedom.', '', 0, -4500000, { happiness: 8, reputation: 3 }, 'You bought a second-hand scooter.', {
    requires: [{ kind: 'min-age', age: 17, reason: 'From age 17, with a SIM C licence' }],
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
]
