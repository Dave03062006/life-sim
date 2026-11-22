import { BABY_AGE_MAX, MAX_CHILDREN, PARTNER_YEARS } from '../../../life/family'
import type { EventAction, EventDef, Outcome } from '../../types'

type Tiers = [Outcome, Outcome, Outcome]
const o = (text: string, more: Partial<Outcome> = {}): Outcome => ({ text, ...more })
const act = (id: string, label: string, chance: number, [success, mixed, fail]: Tiers, more: Partial<EventAction> = {}): EventAction =>
  ({ id, label, chance, outcomes: { success, mixed, fail }, ...more })
const LATE: EventDef['stages'] = ['late-teen']
const COVERED = { id: 'covered-friend', text: 'You covered for {friend} when they skipped class.' }

const choices: EventDef[] = [
  {
    id: 'class-trip-money', kind: 'choice', stages: LATE, weight: 2, big: true, art: 'class-trip', when: [{ kind: 'age', min: 16 }], cast: { friend: 'friend' },
    title: 'The class trip money is missing',
    text: 'Rp 800.000 has gone from the class cash box, and people are looking at {friend}. You saw them near it yesterday.',
    actions: [
      act('defend', 'Defend {friend}', 55, [
        o("You vouched for {friend}. The money turned up in the treasurer's bag, and {friend} will not forget it.", { effects: { reputation: 3, happiness: 3 }, closeness: { friend: 10 } }),
        o('The class listened, but a few people kept whispering.', { effects: { reputation: 1, stress: 3 }, closeness: { friend: 4 } }),
        o('Nobody believed you, and now the whispers include your name.', { effects: { reputation: -4, stress: 4 }, closeness: { friend: 3 } }),
      ]),
      act('stay-out', 'Stay out of it', 70, [
        o('It blew over by itself. You kept your head down.', { effects: { stress: -1 } }),
        o('It blew over, but {friend} noticed you said nothing.', { effects: { stress: 2 }, closeness: { friend: -4 } }),
        o('The fuss dragged on for weeks and {friend} felt alone.', { effects: { stress: 4, happiness: -3 }, closeness: { friend: -8 } }),
      ]),
      act('tell-teacher', 'Tell the teacher what you saw', 60, [
        o('Bu Sari checked the cash box log. It was a counting mistake, and she thanked you for speaking up.', { effects: { reputation: 3, stress: -2 } }),
        o('The teacher listened, but could not settle it that day.', { effects: { reputation: 1, stress: 3 }, closeness: { friend: -4 } }),
        o('The teacher pointed at {friend}. It turned out unfair, and {friend} blames you.', { effects: { reputation: -3, stress: 5 }, closeness: { friend: -12 } }),
      ]),
      act('speak', 'Speak for the class', 65, [
        o('You stood up and asked everyone to check the facts first. The class went quiet, then clapped.', { effects: { reputation: 5, happiness: 3 }, closeness: { friend: 6 } }),
        o('Your speech was a bit shaky, but it calmed the room.', { effects: { reputation: 2, stress: 3 } }),
        o('You lost your words halfway through and the class laughed.', { effects: { reputation: -2, happiness: -3 } }),
      ], { open: { condition: { kind: 'stat', key: 'reputation', min: 60 }, note: 'Open to you: Reputation 60+' } }),
      act('remind', 'Remind {friend} what they owe you', 70, [
        o('{friend} remembered who took the box home to count it, and the money turned up.', { effects: { stress: -2 }, closeness: { friend: 4 } }),
        o('{friend} sighed and agreed to help sort it out, though it was awkward.', { effects: { stress: 2 }, closeness: { friend: -2 } }),
        o('{friend} said that favour was a long time ago. That stung.', { effects: { happiness: -4 }, closeness: { friend: -8 } }),
      ], { open: { condition: { kind: 'memory', id: 'covered-friend' }, note: 'Open to you: your choice at 15' } }),
    ],
  },
  {
    id: 'cover-for-friend', kind: 'choice', stages: LATE, weight: 3, cast: { friend: 'friend' }, when: [{ kind: 'age', min: 15, max: 15 }, { kind: 'no-memory', id: 'covered-friend' }],
    title: '{friend} skipped class',
    text: 'The bell rang and {friend} is still at the kantin. Pak Hadi is taking attendance and looks your way.',
    actions: [
      act('cover', 'Say {friend} went to the toilet', 60, [
        o('Pak Hadi nodded. {friend} slipped in two minutes later and mouthed a big thank you.', { effects: { stress: 2 }, closeness: { friend: 10 }, memory: COVERED }),
        o('Pak Hadi gave you a long look, but let it go. {friend} owes you one.', { effects: { stress: 3, reputation: -1 }, closeness: { friend: 6 }, memory: COVERED }),
        o('Pak Hadi did not buy it and made you both stand at the back.', { effects: { stress: 4, reputation: -3 }, closeness: { friend: 4 }, memory: COVERED }),
      ]),
      act('truth', 'Tell the truth', 70, [
        o('Pak Hadi appreciated the honesty and only gave {friend} a warning.', { effects: { reputation: 2 }, closeness: { friend: -4 } }),
        o('{friend} got a lecture and glared at you in the corridor.', { effects: { stress: 2 }, closeness: { friend: -7 } }),
        o('{friend} got detention and told everyone you snitched.', { effects: { reputation: -2, happiness: -3 }, closeness: { friend: -12 } }),
      ]),
      act('shrug', 'Say you do not know', 75, [
        o('Pak Hadi shrugged and moved on.', { effects: { stress: -1 } }),
        o('Pak Hadi marked {friend} late and said nothing more.', { effects: { stress: 1 } }),
        o('Pak Hadi noticed you were hiding something and watched you for the rest of the day.', { effects: { stress: 3 } }),
      ]),
    ],
  },
  {
    id: 'friend-remembers', kind: 'choice', stages: LATE, weight: 3, cast: { friend: 'friend' }, when: [{ kind: 'memory', id: 'covered-friend' }],
    title: '{friend} needs a hand',
    text: '{friend} is stuck with a pile of unfinished homework and asks if you could look it over together.',
    recall: { memory: 'covered-friend', text: '{friend} has not forgotten that you covered for them.' },
    actions: [
      act('help', 'Work through it together', 75, [
        o('You finished it in an hour, ate gorengan, and laughed the whole time.', { effects: { happiness: 4, smarts: 2 }, closeness: { friend: 8 } }),
        o('It took all afternoon, but you got there.', { effects: { smarts: 1, stress: 3 }, closeness: { friend: 5 } }),
        o('You both got stuck on the same question and gave up.', { effects: { stress: 3 }, closeness: { friend: 2 } }),
      ]),
      act('lend', 'Lend your notebook', 80, [
        o('{friend} copied the key parts and returned it with a snack.', { effects: { happiness: 2 }, closeness: { friend: 5 } }),
        o('{friend} returned it with a coffee ring on the cover.', { effects: { stress: 1 }, closeness: { friend: 3 } }),
        o('{friend} lost it for a week before it turned up.', { effects: { stress: 3 }, closeness: { friend: -2 } }),
      ]),
      act('decline', 'Say you are busy today', 70, [
        o('{friend} understood and said another day.', { effects: { stress: 1 } }),
        o('{friend} looked a little hurt but nodded.', { closeness: { friend: -3 } }),
        o('{friend} said the favour only goes one way, apparently.', { effects: { happiness: -2 }, closeness: { friend: -6 } }),
      ]),
    ],
  },
  {
    id: 'new-face-in-class', kind: 'choice', stages: LATE, weight: 2,
    title: 'Someone new in class',
    text: 'A student from another school has joined your kelas. Everyone keeps glancing at the seat by the window, and so do you.',
    actions: [
      act('hello', 'Say hello at break', 60, [
        o('You shared a bag of keripik and talked until the bell. Your heart is a little loud.', { effects: { happiness: 4 }, addPerson: { relation: 'crush' } }),
        o('A short, shy chat, but it was a start.', { effects: { happiness: 2 }, addPerson: { relation: 'crush' } }),
        o('You said hello at exactly the same time as someone else, and it got silly.', { effects: { stress: 2 } }),
      ], { romance: true }),
      act('notes', 'Offer to share your notes', 65, [
        o('They said thanks and sat next to you for the next lesson.', { effects: { happiness: 3, smarts: 1 }, addPerson: { relation: 'crush' } }),
        o('They took the notes politely and left it at that.', { effects: { smarts: 1 }, addPerson: { relation: 'crush' } }),
        o('Your handwriting was too messy and they could not read it.', { effects: { happiness: -2 } }),
      ], { romance: true }),
      act('friend', 'Gossip about it with a friend', 75, [
        o('You and a friend made up three backstories. All of them were wrong, and all were funny.', { effects: { happiness: 3 } }),
        o('Your friend laughed, but others heard.', { effects: { happiness: 1 } }),
        o('Your friend was more interested in the kantin menu.', { effects: { stress: 1 } }),
      ]),
      act('study', 'Focus on the lesson', 75, [
        o('Bu Ratna praised your full notes.', { effects: { smarts: 3, reputation: 1 } }),
        o('You understood most of it.', { effects: { smarts: 2 } }),
        o('You stared out of the window anyway.', { effects: { smarts: 1, stress: 1 } }),
      ]),
    ],
  },
  {
    id: 'note-from-crush', kind: 'choice', stages: LATE, weight: 1, cast: { crush: 'crush' },
    title: 'A folded note',
    text: 'A folded note from {crush} lands on your desk during Matematika. It says: "Are you free after school?"',
    actions: [
      act('reply', 'Write back yes', 60, [
        o('You walked home together by the sawah path. Nothing happened, and everything happened.', { effects: { happiness: 5 }, closeness: { crush: 10 } }),
        o('You met at the gate and it was a little awkward, but nice.', { effects: { happiness: 3 }, closeness: { crush: 5 } }),
        o('You waited at the gate and {crush} had to leave early.', { effects: { happiness: -3 }, closeness: { crush: -2 } }),
      ], { romance: true }),
      act('tease', 'Write a joke back', 65, [
        o('The whole row giggled. {crush} just smiled.', { effects: { happiness: 3, reputation: 1 }, closeness: { crush: 3 } }),
        o("It ended up in Pak Doni's hands, and he read it aloud, kindly.", { effects: { stress: 3, reputation: -1 } }),
        o('The joke fell flat and the note was never mentioned again.', { effects: { happiness: -2 } }),
      ]),
      act('busy', 'Say you have to help at home', 75, [
        o('{crush} understood, and said another time.', { effects: { stress: 1 } }),
        o('You felt a bit sorry about it all afternoon.', { effects: { stress: 2 } }),
        o('You were never sure what that note was about.', { effects: { happiness: -2 } }),
      ]),
    ],
  },
  {
    id: 'ulangan-whisper', kind: 'choice', stages: LATE, weight: 3, cast: { friend: 'friend' },
    title: 'A whisper during ulangan',
    text: 'During the biology ulangan, {friend} leans over and whispers, "Number seven?" Bu Ratna is walking the aisle.',
    actions: [
      act('refuse', 'Shake your head and keep writing', 75, [
        o('{friend} sighed, then did their best. Bu Ratna noticed the quiet.', { effects: { reputation: 2, smarts: 1 }, closeness: { friend: -1 } }),
        o('You finished on time, though your hand shook.', { effects: { stress: 2 }, closeness: { friend: -3 } }),
        o('{friend} sulked for the whole break.', { effects: { stress: 3 }, closeness: { friend: -6 } }),
      ]),
      act('whisper', 'Whisper the answer', 40, [
        o('Nobody noticed. {friend} owes you a bakso.', { effects: { stress: 2 }, closeness: { friend: 6 } }),
        o('Bu Ratna looked at you both and said only "eyes on your own paper."', { effects: { stress: 4, reputation: -2 }, closeness: { friend: 3 } }),
        o('Caught. Both of you stayed back to redo the test.', { effects: { stress: 6, reputation: -5 }, closeness: { friend: 2 } }),
      ]),
      act('after', 'Offer to study together after', 80, [
        o('You went through every chapter in the library. {friend} was grateful.', { effects: { smarts: 3, happiness: 2 }, closeness: { friend: 6 } }),
        o('You tried, but it was too late for this test.', { effects: { smarts: 1 }, closeness: { friend: 3 } }),
        o('{friend} said "next time" and did not turn up.', { effects: { stress: 1 }, closeness: { friend: -2 } }),
      ]),
    ],
  },
  {
    id: 'osis-election', kind: 'choice', stages: LATE, weight: 2,
    title: 'OSIS elections',
    text: 'The student council is looking for a new committee. Posters cover the corridor, and a friend nominated you as a joke. Or maybe not.',
    actions: [
      act('run', 'Run for a place', 50, [
        o('You won a seat. Your first job was ordering the flag ceremony chairs.', { effects: { reputation: 6, happiness: 3, stress: 3 } }),
        o('You came second and were offered a smaller role.', { effects: { reputation: 3, stress: 2 } }),
        o('You lost by ten votes, and the winner shook your hand.', { effects: { reputation: 1, happiness: -3 } }),
      ]),
      act('campaign', 'Help a friend campaign', 70, [
        o('Your friend won and thanked you in the speech.', { effects: { reputation: 3, happiness: 3 } }),
        o('The poster you drew got more attention than the candidate.', { effects: { reputation: 2, looks: 1 } }),
        o('Rain washed away every poster.', { effects: { stress: 2 } }),
      ]),
      act('skip', 'Stay out of it', 80, [
        o('You spent the lunch break in peace.', { effects: { stress: -3, happiness: 1 } }),
        o('You watched the speeches from the back.', { effects: { stress: -1 } }),
        o('You regretted not joining when the results came.', { effects: { happiness: -2 } }),
      ]),
    ],
  },
  {
    id: 'kantin-tab', kind: 'choice', stages: LATE, weight: 3, cast: { friend: 'friend' },
    title: 'Ibu Kantin is counting',
    text: 'The kantin lady shows a notebook. {friend} owes her Rp 45.000, and says you promised to chip in.',
    actions: [
      act('pay', 'Pay the whole thing', 70, [
        o('You paid. {friend} repaid you half the next day with a grin.', { money: -25_000, effects: { reputation: 1 }, closeness: { friend: 6 } }),
        o('You paid, and {friend} swore to pay you back someday.', { money: -45_000, closeness: { friend: 4 } }),
        o('You paid, then found out the notebook counted soda twice.', { money: -45_000, effects: { stress: 3 }, closeness: { friend: 2 } }),
      ]),
      act('half', 'Split it', 75, [
        o('You each paid Rp 22.500. Ibu Kantin added a free pisang goreng.', { money: -22_500, effects: { happiness: 2 }, closeness: { friend: 4 } }),
        o('You each paid half, and {friend} grumbled about it.', { money: -22_500, closeness: { friend: 1 } }),
        o('The half turned out to be Rp 30.000 after some creative maths.', { money: -30_000, effects: { stress: 2 } }),
      ]),
      act('refuse', 'Say you never promised', 55, [
        o('{friend} shrugged and paid their own tab.', { closeness: { friend: -2 } }),
        o('{friend} was upset, but paid Ibu Kantin back slowly.', { effects: { stress: 2 }, closeness: { friend: -5 } }),
        o('Ibu Kantin wrote both of your names in the notebook.', { effects: { reputation: -2, stress: 3 }, closeness: { friend: -8 } }),
      ]),
    ],
  },
  {
    id: 'angkot-wallet', kind: 'choice', stages: LATE, weight: 2,
    title: 'A wallet on the angkot',
    text: 'As you climb out of the angkot, you spot a brown wallet on the seat. It has a few notes and a student card.',
    actions: [
      act('driver', 'Give it back to the driver', 80, [
        o('The driver recognised the owner and thanked you. He gave you a free ride the next day.', { effects: { reputation: 2, happiness: 3 }, money: 10_000 }),
        o('The driver took it and said he would try to find them.', { effects: { happiness: 1 } }),
        o('You ran after the angkot but missed it.', { effects: { stress: 2 } }),
      ]),
      act('card', 'Return it using the student card', 65, [
        o('The owner was from the neighbouring school and gave you Rp 50.000 as thanks.', { money: 50_000, effects: { reputation: 3, happiness: 3 } }),
        o('You found the school, and they thanked you by announcement.', { effects: { reputation: 3 } }),
        o('You spent two hours looking, and the card was out of date.', { effects: { stress: 3 }, money: -10_000 }),
      ]),
      act('teacher', 'Hand it to Pak Doni at school', 80, [
        o('Pak Doni announced it in assembly and the owner came by.', { effects: { reputation: 2 } }),
        o('Pak Doni said he would deal with it.', { effects: { stress: -1 } }),
        o('Nobody claimed it and you never heard what happened.', { effects: { happiness: -1 } }),
      ]),
    ],
  },
  {
    id: 'mother-warung', kind: 'choice', stages: LATE, weight: 3, cast: { mother: 'mother' },
    title: '{mother} needs help at the warung',
    text: '{mother} has a big order for tomorrow and a mountain of onions. She asks if you can help after school.',
    actions: [
      act('help', 'Help all afternoon', 75, [
        o('You peeled onions until your eyes ran, and {mother} fed you the best fried rice of your life.', { effects: { happiness: 3, health: 1 }, closeness: { mother: 8 } }),
        o('You helped for an hour and got a pat on the shoulder.', { effects: { stress: 2 }, closeness: { mother: 5 } }),
        o('You dropped the whole bowl and had to start again.', { effects: { stress: 3 }, closeness: { mother: 2 } }),
      ]),
      act('part', 'Help for an hour, then do homework', 80, [
        o('You did both, and {mother} gave you extra pocket money.', { money: 20_000, effects: { smarts: 1 }, closeness: { mother: 4 } }),
        o('You finished both, a bit tired.', { effects: { stress: 2 }, closeness: { mother: 3 } }),
        o('You did neither well.', { effects: { stress: 4 }, closeness: { mother: -1 } }),
      ]),
      act('rest', 'Say you are exhausted', 60, [
        o('{mother} understood and sent you off for a nap.', { effects: { health: 2, stress: -3 }, closeness: { mother: 1 } }),
        o('{mother} sighed and managed alone.', { effects: { stress: -1 }, closeness: { mother: -3 } }),
        o('{mother} did not say anything, which was worse.', { effects: { happiness: -3 }, closeness: { mother: -6 } }),
      ]),
    ],
  },
  {
    id: 'father-bicycle', kind: 'choice', stages: LATE, weight: 2, cast: { father: 'father' },
    title: '{father} opens the toolbox',
    text: 'Your bicycle chain snapped again. {father} sits on the porch with the toolbox and says, "Come and see how it is done."',
    actions: [
      act('learn', 'Fix it together', 70, [
        o('Oil to your elbows, but the bike runs. {father} told a story from his own school days.', { effects: { smarts: 2, happiness: 3 }, closeness: { father: 8 } }),
        o('You fixed it on the third try.', { effects: { smarts: 1, stress: 1 }, closeness: { father: 5 } }),
        o('You tightened the wrong bolt, and the pedals fell off.', { effects: { stress: 3 }, money: -15_000, closeness: { father: 3 } }),
      ]),
      act('watch', 'Watch from the porch with tea', 80, [
        o('{father} fixed it while you chatted about school.', { effects: { happiness: 2 }, closeness: { father: 4 } }),
        o('{father} fixed it with a few sighs.', { effects: { stress: 1 }, closeness: { father: 1 } }),
        o('{father} said you ought to learn it sometime.', { effects: { stress: 1 }, closeness: { father: -2 } }),
      ]),
      act('shop', 'Take it to the bengkel', 80, [
        o('The mechanic charged very little and gave you a free chain lube.', { money: -15_000 }),
        o('It cost Rp 40.000 and took all afternoon.', { money: -40_000, effects: { stress: 1 } }),
        o('The shop was closed, so you walked to school the next day.', { effects: { health: 1, stress: 2 } }),
      ]),
    ],
  },
  {
    id: 'sibling-borrowed', kind: 'choice', stages: LATE, weight: 3, cast: { sibling: 'sibling' },
    title: '{sibling} borrowed your things',
    text: "Your favourite shirt and charger are missing. You find them in {sibling}'s room, along with a chocolate stain.",
    actions: [
      act('talk', 'Talk it through', 65, [
        o('{sibling} apologised, handed you a snack, and promised to ask first.', { effects: { happiness: 2 }, closeness: { sibling: 6 } }),
        o('You settled it, though a stain remains.', { effects: { stress: 1 }, closeness: { sibling: 2 } }),
        o('You talked and {sibling} said you were making a big fuss.', { effects: { stress: 3 }, closeness: { sibling: -3 } }),
      ]),
      act('swap', 'Borrow something of theirs in return', 70, [
        o('You both laughed and called it even.', { effects: { happiness: 3 }, closeness: { sibling: 5 } }),
        o('{sibling} grumbled but allowed it.', { effects: { stress: 1 }, closeness: { sibling: 1 } }),
        o('{sibling} said "no way", and the argument got loud.', { effects: { stress: 3 }, closeness: { sibling: -5 } }),
      ]),
      act('parents', 'Tell your parents', 60, [
        o('Your parents said it was fair, and {sibling} washed the shirt.', { effects: { stress: -1 }, closeness: { sibling: -2 } }),
        o('Your parents told you both to sort it out.', { effects: { stress: 2 }, closeness: { sibling: -3 } }),
        o('{sibling} said you were a snitch for a whole week.', { effects: { happiness: -3 }, closeness: { sibling: -8 } }),
      ]),
    ],
  },
  {
    id: 'forgotten-pr', kind: 'choice', stages: LATE, weight: 3,
    title: 'The forgotten homework',
    text: 'Pak Doni is collecting homework. You open your bag and your homework is not there. It is sitting on your desk at home.',
    actions: [
      act('honest', 'Admit you forgot it', 75, [
        o('Pak Doni respected your honesty and let you bring it tomorrow.', { effects: { reputation: 2, stress: -1 } }),
        o('Pak Doni deducted a few points but let you submit it.', { effects: { stress: 2 } }),
        o('Pak Doni sighed and gave you extra homework as well.', { effects: { stress: 4, smarts: 1 } }),
      ]),
      act('quick', 'Rewrite it during break', 60, [
        o('You finished with a minute to spare. Messy but complete.', { effects: { smarts: 2, stress: 2 } }),
        o('You finished half before the bell.', { effects: { stress: 3 } }),
        o('You missed your lunch and finished nothing.', { effects: { stress: 4, health: -1 } }),
      ]),
      act('excuse', 'Say the dog ate it', 35, [
        o('Pak Doni laughed so hard he forgave you.', { effects: { reputation: 1, happiness: 3 } }),
        o('Pak Doni raised an eyebrow, then allowed it just this once.', { effects: { stress: 3 } }),
        o('Pak Doni said you do not even have a dog.', { effects: { reputation: -3, stress: 4 } }),
      ]),
    ],
  },
  {
    id: 'agustusan-race', kind: 'choice', stages: LATE, weight: 3, cast: { friend: 'friend' },
    title: 'The Agustusan races',
    text: 'It is 17 Agustus. The neighbourhood has set up the sack race, kerupuk eating and panjat pinang. {friend} wants you on the team.',
    actions: [
      act('join', 'Join the sack race with {friend}', 55, [
        o('You won! A bag of rice and a thousand cheers.', { effects: { happiness: 5, reputation: 3 }, money: 30_000, closeness: { friend: 6 } }),
        o('You came fourth and ate kerupuk to forget it.', { effects: { happiness: 3, health: 1 }, closeness: { friend: 4 } }),
        o('You tripped at the start and everyone cheered anyway.', { effects: { happiness: 1, health: -1 }, closeness: { friend: 3 } }),
      ]),
      act('kerupuk', 'Enter the kerupuk eating contest', 60, [
        o('Eaten in record time. Your stomach regrets nothing.', { effects: { happiness: 4, reputation: 2 } }),
        o('You came second. Your friend said you chewed too slowly.', { effects: { happiness: 2 } }),
        o('Coughed crumbs everywhere, laughed, and got the sympathy prize.', { effects: { happiness: 1, reputation: -1 } }),
      ]),
      act('cheer', 'Cheer from the side', 80, [
        o('You cheered so loudly you lost your voice.', { effects: { happiness: 3 }, closeness: { friend: 3 } }),
        o('You enjoyed the day with a plastic cup of es teh.', { effects: { happiness: 2, stress: -2 } }),
        o('You were too hot and went home early.', { effects: { happiness: -1 } }),
      ]),
    ],
  },
  {
    id: 'group-project', kind: 'choice', stages: LATE, weight: 3, cast: { friend: 'friend' },
    title: 'Group work, one working member',
    text: 'Your group has a presentation on Friday. {friend} has not done anything, and everybody else is also waiting for you.',
    actions: [
      act('do-it', 'Do most of it yourself', 70, [
        o('You presented well and the teacher gave full marks. The group bought you es campur.', { effects: { smarts: 3, reputation: 2, stress: 3 }, closeness: { friend: 2 } }),
        o('You did the lot and were exhausted, but it went fine.', { effects: { smarts: 2, stress: 5 } }),
        o('You were so tired you muddled the final slide.', { effects: { stress: 6, smarts: 1 } }),
      ]),
      act('assign', 'Divide the work fairly and set a deadline', 65, [
        o('Everyone did their part, even {friend}. The group got praise.', { effects: { reputation: 3, smarts: 2 }, closeness: { friend: 3 } }),
        o('Most of it came together by Thursday.', { effects: { smarts: 1, stress: 2 } }),
        o('{friend} turned in blank slides. You fixed them at midnight.', { effects: { stress: 5 }, closeness: { friend: -4 } }),
      ]),
      act('complain', 'Tell the teacher {friend} is not helping', 60, [
        o('The teacher gave {friend} a fair talking-to, and they did the work.', { effects: { reputation: 1 }, closeness: { friend: -4 } }),
        o('The teacher said groups should sort things out themselves.', { effects: { stress: 3 }, closeness: { friend: -4 } }),
        o('{friend} found out and stopped speaking to you.', { effects: { stress: 4, happiness: -3 }, closeness: { friend: -10 } }),
      ]),
    ],
  },
  {
    id: 'weekend-job', kind: 'choice', stages: LATE, weight: 2,
    title: 'A weekend job offer',
    text: 'A neighbour who runs a laundry shop offers you a weekend job folding clothes, Rp 100.000 for the day.',
    actions: [
      act('take', 'Take the job', 70, [
        o('You folded the neatest stacks they had ever seen and got a tip.', { money: 130_000, effects: { stress: 2, reputation: 1 } }),
        o('A long, tiring day, but the money was real.', { money: 100_000, effects: { stress: 3, health: -1 } }),
        o('You were so slow they sent you home halfway.', { money: 30_000, effects: { stress: 2 } }),
      ]),
      act('part', 'Ask for half a day', 75, [
        o('They agreed, and you still had time to see friends.', { money: 55_000, effects: { happiness: 2 } }),
        o('They paid you for half a day, no tip.', { money: 50_000, effects: { stress: 1 } }),
        o('Half-day work was not available, so you stayed home.', { effects: { happiness: -1 } }),
      ]),
      act('decline', 'Say no, you want your weekend', 80, [
        o('You slept in and played futsal all afternoon.', { effects: { happiness: 4, health: 1, stress: -3 } }),
        o('You enjoyed your weekend, mostly.', { effects: { happiness: 2 } }),
        o('You spent the weekend wishing you had money for a new shirt.', { effects: { happiness: -2 } }),
      ]),
    ],
  },
  {
    id: 'exam-nerves', kind: 'choice', stages: LATE, weight: 2,
    title: 'The night before the exam',
    text: 'Tomorrow is the semester exam, and you cannot sleep.',
    actions: [
      act('cram', 'Study till late', 60, [
        o('You went in with a head full of facts, and it paid off.', { effects: { smarts: 4, stress: 3 } }),
        o('You remembered about half of it.', { effects: { smarts: 2, stress: 4, health: -1 } }),
        o('You fell asleep on your book and woke up with a printed cheek.', { effects: { stress: 5, health: -2 } }),
      ]),
      act('sleep', 'Go to bed early', 75, [
        o('You woke up clear-headed and calm.', { effects: { health: 2, stress: -3, smarts: 2 } }),
        o('You tossed a while but rested enough.', { effects: { health: 1 } }),
        o('You slept so well you almost missed the first paper.', { effects: { stress: 4 } }),
      ]),
      act('walk', 'Walk around the block and clear your head', 70, [
        o('The cool night air and a cup of wedang calmed you down.', { effects: { stress: -4, happiness: 2 } }),
        o('You bumped into friends and chatted for an hour.', { effects: { happiness: 3, smarts: -1 } }),
        o('It started to rain and you came back wet.', { effects: { health: -2, stress: 2 } }),
      ]),
    ],
  },
]

const newsItem = (id: string, title: string, text: string, news: Partial<Outcome> = {}): EventDef =>
  ({ id, kind: 'news', stages: LATE, weight: 2, title, text, news: { text, ...news } })

const news: EventDef[] = [
  newsItem('news-roof-leak', 'The roof leaks', 'The rainy season found a hole in the roof. You chipped in your savings for the tiles.', { effects: { stress: 3 }, money: -150_000 }),
  newsItem('news-aunt-gift', 'A gift from your aunt', 'Your aunt visited from out of town and slipped some money into your hand, "for books".', { effects: { happiness: 3 }, money: 100_000 }),
  newsItem('news-flu', 'A bad flu', 'The weather changed and so did your nose. You spent a week under a blanket with tea.', { effects: { health: -5, happiness: -2 } }),
  newsItem('news-sports-day', 'Sports day', 'The whole school ran around the field for the annual sports day. You were sore but happy.', { effects: { health: 3, happiness: 3 } }),
  newsItem('news-teacher-praise', 'Praise from Bu Ratna', 'Bu Ratna read your essay out loud to the class. You went red, but you are proud.', { effects: { smarts: 2, reputation: 3, happiness: 3 } }),
  newsItem('news-school-closed', 'School closed for a day', 'A flooded road closed the school for a day. You played cards and ate mie instan.', { effects: { happiness: 3, stress: -3 } }),
  newsItem('news-phone-broken', 'The phone cracked', 'Your phone slipped from your hand and the screen spiderwebbed. You paid for the repair out of your savings.', { effects: { stress: 3 }, money: -120_000 }),
  newsItem('news-kantin-sale', 'A new kantin menu', 'The kantin started selling a sweet bakwan for Rp 1.000. Half the school queued up.', { effects: { happiness: 2 } }),
  newsItem('news-lomba-prize', 'A small prize', 'Your kelas won second place in the school quiz lomba. Everyone got a small voucher for the koperasi.', { effects: { happiness: 3, reputation: 2 }, money: 30_000 }),
  newsItem('news-toothache', 'A toothache', 'Too many es teh manis. A trip to the puskesmas fixed the tooth and emptied your wallet a little.', { effects: { health: -2, stress: 2 }, money: -50_000 }),
]

const stageNews = (stage: EventDef['stages'][number], id: string, title: string, text: string, news: Partial<Outcome> = {}): EventDef =>
  ({ id, kind: 'news', stages: [stage], weight: 2, title, text, news: { text, ...news } })

const lifeNews: EventDef[] = [
  stageNews('baby', 'news-baby-laugh', 'Your first big laugh', 'You laughed out loud at a sneezing cat. Your mother laughed so hard she had to sit down.', { effects: { happiness: 3 } }),
  stageNews('baby', 'news-baby-cold', 'A runny nose', 'You caught a small cold. Your parents took turns carrying you around the house all night.', { effects: { health: -2, happiness: -1 } }),
  stageNews('small-child', 'news-sc-lost-sandal', 'The missing sandal', 'You lost one sandal at the neighbour’s house. It turned up in the rice bucket a week later.', { effects: { happiness: 2 } }),
  stageNews('small-child', 'news-sc-rain', 'Playing in the rain', 'The rain came down and you ran out before anyone could stop you. The tea afterwards was worth it.', { effects: { happiness: 3, health: -1 } }),
  stageNews('child', 'news-child-bag', 'A new school bag', 'Your parents bought you a new school bag with your favourite cartoon on it. You carried it everywhere.', { effects: { happiness: 3 } }),
  stageNews('child', 'news-child-scraped-knee', 'A scraped knee', 'You fell off your bike on the way home. A plaster and a sweet drink fixed most of it.', { effects: { health: -2, happiness: 1 } }),
  stageNews('early-teen', 'news-et-growth', 'Taller overnight', 'You grew three centimetres over the holidays. Your school trousers are suddenly too short.', { effects: { looks: 1, stress: 1 }, money: -60_000 }),
  stageNews('early-teen', 'news-et-ulangan', 'A good ulangan', 'You got a high mark on a hard ulangan. You told everyone at home, twice.', { effects: { smarts: 2, happiness: 3 } }),
  stageNews('young-adult', 'news-ya-rent', 'The rent goes up', 'Your landlord raised the monthly rent a little. You adjusted your budget and sighed.', { effects: { stress: 3 }, money: -200_000 }),
  stageNews('young-adult', 'news-ya-weekend', 'A free weekend', 'For once nothing was planned. You slept, cooked and watched too many films.', { effects: { happiness: 3, stress: -3 } }),
  stageNews('adult', 'news-ad-reunion', 'A school reunion', 'Your old class met at a restaurant. Everyone is older, and somehow you all laughed like before.', { effects: { happiness: 3, reputation: 1 } }),
  stageNews('adult', 'news-ad-back', 'A stiff back', 'You lifted a box the wrong way. A week of rest and warm compresses put you right.', { effects: { health: -3, stress: 2 } }),
  stageNews('senior', 'news-se-photos', 'Old photographs', 'You found a box of old photographs. You spent the afternoon naming everyone in them.', { effects: { happiness: 3, stress: -2 } }),
  stageNews('senior', 'news-se-ronda', 'The neighbourhood watch', 'The young ones took over the night watch and brought you a hot cup of tea, just to chat.', { effects: { happiness: 2, reputation: 2 } }),
]

const lifeChoices: EventDef[] = [
  {
    id: 'et-lunch-alone', kind: 'choice', stages: ['early-teen'], weight: 3,
    title: 'Lunch alone',
    text: 'Your usual group is busy today, and the kantin is loud. You hold your tray and look for a seat.',
    actions: [
      act('join', 'Ask to join a table', 60, [
        o('They made room at once, and someone shared their kerupuk.', { effects: { happiness: 3, reputation: 1 } }),
        o('They said yes, a little awkwardly. The lunch was quiet but fine.', { effects: { happiness: 1 } }),
        o('The table was full. You ate near the wall and pretended not to mind.', { effects: { happiness: -2 } }),
      ]),
      act('read', 'Eat alone with a book', 80, [
        o('The book was good and the lunch passed in a blink.', { effects: { smarts: 1, stress: -2 } }),
        o('You read a page or two and mostly watched the others.', { effects: { stress: -1 } }),
        o('You could not focus, and the break felt very long.', { effects: { happiness: -2 } }),
      ]),
      act('library', 'Eat in the library corner', 70, [
        o('It was quiet, and the librarian gave you a book tip.', { effects: { smarts: 2, stress: -2 } }),
        o('You were told no food was allowed, but she let it go this once.', { effects: { stress: 1 } }),
        o('The librarian sent you back to the kantin.', { effects: { happiness: -1 } }),
      ]),
    ],
  },
  {
    id: 'et-mall-trip', kind: 'choice', stages: ['early-teen'], weight: 3,
    title: 'A trip to the mall',
    text: 'Your friends are going to the mall on Saturday. You have a little saved, and the tickets add up.',
    actions: [
      act('go', 'Go and spend a little', 70, [
        o('You split a plate of fries and laughed all afternoon.', { effects: { happiness: 4 }, money: -40_000 }),
        o('It was fun, though the prices made you wince.', { effects: { happiness: 2, stress: 1 }, money: -60_000 }),
        o('It rained, the shops were crowded, and you came back tired.', { effects: { happiness: -1, stress: 2 }, money: -30_000 }),
      ]),
      act('stay', 'Stay home and save', 80, [
        o('You helped at home and your savings grew a little.', { effects: { stress: -1, happiness: 1 } }),
        o('A quiet Saturday. You wondered what you missed.', { effects: { happiness: -1 } }),
        o('You stayed home and everyone posted photos. That stung.', { effects: { happiness: -3 } }),
      ]),
      act('cheap', 'Suggest a free alternative', 60, [
        o('Everyone agreed to play in the park, and it turned out better.', { effects: { happiness: 4, reputation: 2 } }),
        o('A few friends came along. It was a small but happy afternoon.', { effects: { happiness: 2 } }),
        o('Nobody liked the idea, and you ended up going home alone.', { effects: { happiness: -2 } }),
      ]),
    ],
  },
  {
    id: 'ya-two-offers', kind: 'choice', stages: ['young-adult'], weight: 3,
    title: 'Two offers',
    text: 'One job pays a little more but is far from home. The other pays less and is ten minutes away.',
    actions: [
      act('far', 'Take the higher pay', 65, [
        o('The pay is better and your colleagues are friendly. The commute is long, but it was worth it.', { effects: { stress: 2, reputation: 2 }, money: 300_000 }),
        o('The pay is better, though the commute eats your mornings.', { effects: { stress: 4 }, money: 200_000 }),
        o('The job was harder than described and the commute drained you.', { effects: { stress: 6, happiness: -3 }, money: 100_000 }),
      ]),
      act('near', 'Take the job near home', 75, [
        o('You get home early, cook and sleep well. The pay is enough.', { effects: { happiness: 3, stress: -3 }, money: 150_000 }),
        o('Quiet, steady work. Nothing exciting, but nothing to fear either.', { effects: { stress: -1 }, money: 100_000 }),
        o('The work was dull and you wondered about the other offer.', { effects: { happiness: -2 }, money: 100_000 }),
      ]),
      act('think', 'Ask for a few days to think', 70, [
        o('Both places respected the request, and you chose calmly.', { effects: { stress: -2, reputation: 1 } }),
        o('One offer waited, the other moved on. You took the one that waited.', { effects: { stress: 1 } }),
        o('Both moved on while you thought. You started looking again.', { effects: { stress: 4, happiness: -2 } }),
      ]),
    ],
  },
  {
    id: 'ya-dishes', kind: 'choice', stages: ['young-adult'], weight: 3,
    title: 'The dishes pile up',
    text: 'The sink is full and your housemates are all “very busy”. It is your turn, or maybe it is nobody’s.',
    actions: [
      act('wash', 'Wash them all', 80, [
        o('You hummed while you scrubbed. Someone left you a snack as thanks.', { effects: { happiness: 2, stress: -1 } }),
        o('It took an hour, but the kitchen looks lovely.', { effects: { stress: 1 } }),
        o('You broke a glass and got no thanks at all.', { effects: { stress: 3, happiness: -2 } }),
      ]),
      act('rota', 'Put up a cleaning rota', 60, [
        o('Everyone agreed, and the rota actually worked.', { effects: { reputation: 2, stress: -2 } }),
        o('People agreed, then slowly forgot. It helped a bit.', { effects: { stress: 1 } }),
        o('The rota became a joke on the fridge.', { effects: { happiness: -1 } }),
      ]),
      act('talk', 'Talk to them over dinner', 65, [
        o('You cooked, they listened, and they promised to do better.', { effects: { happiness: 3, reputation: 1 } }),
        o('It got a bit awkward but made the point.', { effects: { stress: 1 } }),
        o('Everyone got defensive and ate in silence.', { effects: { happiness: -3, stress: 2 } }),
      ]),
    ],
  },
  {
    id: 'ad-noisy-neighbours', kind: 'choice', stages: ['adult'], weight: 3,
    title: 'Loud neighbours',
    text: 'The house next door has music until midnight again. You have an early morning.',
    actions: [
      act('knock', 'Knock and ask kindly', 70, [
        o('They apologised, turned it down and sent over some kue the next day.', { effects: { stress: -2, reputation: 2 } }),
        o('They turned it down for one night. It is a start.', { effects: { stress: 1 } }),
        o('They did not open the door.', { effects: { stress: 3 } }),
      ]),
      act('rt', 'Mention it to the RT head', 65, [
        o('The RT head had a friendly word, and it stopped quietly.', { effects: { stress: -2 } }),
        o('He promised to look into it. Things improved a little.', { effects: { stress: 1 } }),
        o('He took sides with the neighbours, and it got awkward.', { effects: { reputation: -2, stress: 3 } }),
      ]),
      act('earplugs', 'Buy earplugs and let it go', 80, [
        o('Earplugs are marvellous. You slept like a log.', { effects: { stress: -2, health: 1 }, money: -15_000 }),
        o('They helped a little, though you still heard the bass.', { effects: { stress: 1 }, money: -15_000 }),
        o('They fell out in the night, and you heard everything.', { effects: { stress: 3, happiness: -1 }, money: -15_000 }),
      ]),
    ],
  },
  {
    id: 'ad-overtime', kind: 'choice', stages: ['adult'], weight: 3,
    title: 'Overtime',
    text: 'Your boss asks you to stay late again. The pay is nice, but your sofa has been calling for days.',
    actions: [
      act('stay', 'Stay and work', 70, [
        o('You finished early, got a nice bonus and a thank-you from the boss.', { effects: { reputation: 3, stress: 2 }, money: 150_000 }),
        o('A long night, but the extra pay helps.', { effects: { stress: 4 }, money: 100_000 }),
        o('You stayed late for nothing, and your head hurt.', { effects: { stress: 6, health: -2 } }),
      ]),
      act('leave', 'Say no politely', 65, [
        o('Your boss understood, and you got home for dinner.', { effects: { happiness: 3, stress: -3 } }),
        o('Your boss sighed but said it was fine.', { effects: { stress: 1 } }),
        o('Your boss noticed, and the mood in the office cooled.', { effects: { reputation: -2, stress: 2 } }),
      ]),
      act('half', 'Stay for an hour only', 75, [
        o('A fair deal. Everyone was happy.', { effects: { reputation: 1, stress: -1 }, money: 50_000 }),
        o('You managed most of it and left on time.', { effects: { stress: 1 }, money: 30_000 }),
        o('The hour stretched into three.', { effects: { stress: 4, happiness: -2 } }),
      ]),
    ],
  },
  {
    id: 'se-photo-box', kind: 'choice', stages: ['senior'], weight: 3,
    title: 'The box of photos',
    text: 'A dusty box of old photographs sits in the cupboard. Some faces you can name. Others you cannot.',
    actions: [
      act('share', 'Show them to the family', 75, [
        o('Everyone gathered round. You told stories until the tea went cold.', { effects: { happiness: 4, stress: -3 } }),
        o('A few people looked, and you had a nice afternoon.', { effects: { happiness: 2 } }),
        o('Everyone was busy. You looked through them alone.', { effects: { happiness: -1 } }),
      ]),
      act('album', 'Sort them into an album', 70, [
        o('It took a week, and the album looks wonderful.', { effects: { happiness: 3, smarts: 1 } }),
        o('You sorted half, and left the rest for another day.', { effects: { stress: -1 } }),
        o('You mixed them all up and had to start again.', { effects: { stress: 2 } }),
      ]),
      act('shut', 'Close the box for now', 80, [
        o('Some memories keep. You felt calm.', { effects: { stress: -1 } }),
        o('You peeked once more before putting it away.', { effects: { happiness: 1 } }),
        o('You could not stop thinking about it all night.', { effects: { happiness: -2, stress: 2 } }),
      ]),
    ],
  },
  {
    id: 'se-health-day', kind: 'choice', stages: ['senior'], weight: 3,
    title: 'Health day for seniors',
    text: 'The puskesmas runs a free health day for the elderly. A neighbour asks if you are going.',
    actions: [
      act('go', 'Go and get checked', 80, [
        o('Your blood pressure is fine, and the nurse praised your daily walks.', { effects: { health: 3, stress: -2 } }),
        o('They found a small thing to watch, and gave you simple advice.', { effects: { health: 2, stress: 1 } }),
        o('The queue was long, and you left tired and hungry.', { effects: { stress: 3 } }),
      ]),
      act('together', 'Go with the neighbour', 75, [
        o('You walked together, chatted all the way, and both were checked.', { effects: { health: 2, happiness: 3 } }),
        o('The check was quick, and the walk home was better.', { effects: { health: 1, happiness: 2 } }),
        o('Your neighbour changed their mind. You went alone.', { effects: { happiness: -1 } }),
      ]),
      act('skip', 'Stay home today', 80, [
        o('You rested and felt just fine.', { effects: { stress: -2 } }),
        o('You rested, though you wondered about the check.', { effects: { stress: 1 } }),
        o('You felt a twinge later and wished you had gone.', { effects: { stress: 3, health: -1 } }),
      ]),
    ],
  },
]

// weight 0: never drawn; the people screen queues them with the person cast as `them`
const person = (id: string, title: string, text: string, actions: EventAction[]): EventDef =>
  ({ id, kind: 'choice', stages: ['early-teen', 'late-teen', 'young-adult', 'adult', 'senior'], weight: 0, title, text, actions })

const people: EventDef[] = [
  person('talk', 'A chat with {them}', 'You find a quiet moment to talk with {them}.', [
    act('how', 'Ask how they are', 80, [
      o('{them} opened up about their week, and you listened. You both felt lighter.', { effects: { happiness: 3 }, closeness: { them: 8 } }),
      o('{them} said they were fine, but smiled at the thought.', { effects: { happiness: 1 }, closeness: { them: 4 } }),
      o('{them} was busy and the chat did not go far.', { effects: { happiness: -1 }, closeness: { them: 1 } }),
    ]),
    act('news', 'Share your news', 70, [
      o('{them} was delighted for you and asked a hundred questions.', { effects: { happiness: 4 }, closeness: { them: 7 } }),
      o('{them} listened politely.', { effects: { happiness: 1 }, closeness: { them: 3 } }),
      o('{them} looked at their phone through half of it.', { effects: { happiness: -2 }, closeness: { them: -1 } }),
    ]),
    act('advice', 'Ask for advice', 65, [
      o('{them} gave you a thoughtful answer, and it actually helped.', { effects: { happiness: 2, stress: -3 }, closeness: { them: 6 } }),
      o('{them} offered some advice, though not quite what you needed.', { effects: { stress: -1 }, closeness: { them: 3 } }),
      o('{them} said you should figure it out on your own.', { effects: { happiness: -2 }, closeness: { them: -1 } }),
    ]),
  ]),
  person('ask-out', 'Asking {them} out', 'You take a deep breath. You want to ask {them} to go out with you.', [
    act('direct', 'Ask directly', 55, [
      o('{them} smiled and said yes. You are a couple now.', { effects: { happiness: 8 }, closeness: { them: 10 } }),
      o('{them} said they need time, but they were not unkind about it.', { effects: { happiness: 1, stress: 2 }, closeness: { them: 5 } }),
      o('{them} said no, kindly. It still hurts.', { effects: { happiness: -6 }, closeness: { them: -8 } }),
    ]),
    act('note', 'Write a note', 60, [
      o('{them} read the note twice, then wrote "yes" at the bottom.', { effects: { happiness: 8 }, closeness: { them: 10 } }),
      o('{them} replied that they would think about it.', { effects: { happiness: 1, stress: 2 }, closeness: { them: 4 } }),
      o('The note got passed around before {them} saw it.', { effects: { happiness: -6, reputation: -2 }, closeness: { them: -8 } }),
    ]),
    act('friend', 'Ask through a friend', 45, [
      o('Your friend delivered the message well, and {them} said yes.', { effects: { happiness: 7 }, closeness: { them: 9 } }),
      o('{them} said they would rather hear it from you.', { effects: { happiness: 1, stress: 2 }, closeness: { them: 4 } }),
      o('{them} thought it was a joke and was not amused.', { effects: { happiness: -5 }, closeness: { them: -9 } }),
    ]),
  ]),
]

// Weddings and children. `wedding` is queued by a successful proposal; the baby talk repeats each year until you have a child or say no.
const wedding = (text: string, money: number, effects: Outcome['effects']): Tiers => [
  o(text, { money, effects }),
  o(`${text} The rice ran out early, but nobody minded.`, { money, effects }),
  o(`${text} It rained, and everybody squeezed in closer.`, { money, effects }),
]
const weddingEvent: EventDef = {
  ...person('wedding', 'Your wedding with {them}', 'You and {them} are getting married. How do you want to celebrate?', [
    act('small', 'A small family wedding', 85, wedding('You and {them} held a small family wedding, with warm tea and a lot of aunties.', -15_000_000, { happiness: 6 })),
    act('big', 'A big wedding for the whole neighbourhood', 85, wedding('You and {them} held a big wedding for the whole neighbourhood, with music and far too much food.', -80_000_000, { happiness: 8, reputation: 5 })),
    act('papers', 'Just sign the papers', 85, wedding('You and {them} signed the papers on a quiet morning. It felt exactly right.', 0, { happiness: 3 })),
  ]),
  stages: ['young-adult', 'adult', 'senior'],
}

const NO_KIDS = { id: 'no-kids', text: 'You and {them} chose a life without children.' }
const baby = (id: string, role: 'spouse' | 'partner', weight: number): EventDef => ({
  id, kind: 'choice', stages: ['young-adult', 'adult'], weight, repeat: true, cast: { them: role },
  when: [{ kind: 'partnered', years: PARTNER_YEARS }, { kind: 'children', max: MAX_CHILDREN - 1 }, { kind: 'age', max: BABY_AGE_MAX }, { kind: 'no-memory', id: 'no-kids' }],
  title: 'Talking about a baby',
  text: 'You and {them} have been talking about the future. Lately the talk keeps landing on a small person with your noses.',
  actions: [
    act('try', 'Try for a baby', 75, [
      o('{child} was born.', { effects: { happiness: 8, stress: 3 }, closeness: { them: 6 }, addPerson: { relation: 'child' } }),
      o('Not this year. You and {them} stayed hopeful.', { effects: { happiness: 1 } }),
      o('Not this year. You and {them} agreed to keep trying and keep laughing.', { effects: { stress: 1 } }),
    ]),
    act('wait', 'Wait a few years', 80, [
      o('You and {them} agreed to wait. You booked a holiday instead.', { effects: { happiness: 2, stress: -2 }, closeness: { them: 3 } }),
      o('You and {them} agreed to wait, though your mothers sighed loudly.', { effects: { stress: 1 } }),
      o('You and {them} disagreed about the timing, then made up over noodles.', { effects: { stress: 2 }, closeness: { them: -1 } }),
    ]),
    act('happy', "We're happy as we are", 80, [
      o('You and {them} agreed it is just the two of you. The house stays quiet and yours.', { effects: { happiness: 3, stress: -3 }, closeness: { them: 5 }, memory: NO_KIDS }),
      o('You and {them} agreed, though a few relatives will need convincing.', { effects: { stress: 1 }, memory: NO_KIDS }),
      o('You and {them} agreed, after a long and slightly awkward talk.', { effects: { stress: 2 }, memory: NO_KIDS }),
    ]),
  ],
})

const FAMILY_STAGES: EventDef['stages'] = ['young-adult', 'adult']
const family: EventDef[] = [
  baby('baby-talk', 'spouse', 4),
  baby('baby-talk-partner', 'partner', 3),
  {
    id: 'spouse-bad-week', kind: 'choice', stages: FAMILY_STAGES, weight: 3, cast: { spouse: 'spouse' },
    title: '{spouse} has a bad week',
    text: '{spouse} comes home quiet. Work was loud, the bus was late, and the rice cooker has opinions.',
    actions: [
      act('listen', 'Make tea and listen', 80, [
        o('{spouse} talked it all out, and the week looked smaller after tea.', { effects: { happiness: 2, stress: -2 }, closeness: { spouse: 6 } }),
        o('{spouse} said thanks and went to bed early.', { effects: { stress: -1 }, closeness: { spouse: 3 } }),
        o('You listened, but the tea went cold and so did the mood.', { effects: { stress: 2 }, closeness: { spouse: 1 } }),
      ]),
      act('cook', 'Cook their favourite meal', 70, [
        o('The nasi goreng was nearly perfect. {spouse} had seconds.', { effects: { happiness: 3 }, closeness: { spouse: 7 } }),
        o('The dinner was a little salty, and {spouse} ate it anyway.', { effects: { happiness: 1 }, closeness: { spouse: 4 } }),
        o('You burnt the garlic. {spouse} laughed for the first time all week.', { effects: { stress: 1 }, closeness: { spouse: 3 } }),
      ]),
      act('space', 'Give them space', 75, [
        o('{spouse} took a long walk and came back smiling.', { effects: { stress: -1 }, closeness: { spouse: 2 } }),
        o('{spouse} wanted space, and you both got on with the evening.', { effects: { stress: 1 } }),
        o('{spouse} wondered why you did not ask. The evening felt long.', { effects: { happiness: -1 }, closeness: { spouse: -3 } }),
      ]),
    ],
  },
  {
    id: 'spouse-anniversary', kind: 'news', stages: FAMILY_STAGES, weight: 2, cast: { spouse: 'spouse' },
    title: 'Another year together', text: 'You and {spouse} remember the day you were married.',
    news: { text: 'You and {spouse} celebrated the years together with fried tempeh and a very long nap.', effects: { happiness: 2 }, closeness: { spouse: 3 } },
  },
  {
    id: 'child-late-night', kind: 'choice', stages: FAMILY_STAGES, weight: 3, cast: { child: 'child' },
    title: 'A late night with {child}', text: 'It is late, and {child} is still up and wants your company.',
    actions: [
      act('talk', 'Sit and talk', 80, [
        o('You and {child} talked until the tea went cold, and neither of you minded.', { effects: { happiness: 3 }, closeness: { child: 6 } }),
        o('{child} listened to every word, then asked for another round of tea.', { effects: { stress: 1 }, closeness: { child: 4 } }),
        o('You nodded off mid-sentence, and {child} found it very funny.', { effects: { stress: 1 }, closeness: { child: 3 } }),
      ]),
      act('snack', 'Make a snack together', 70, [
        o('The two of you made a very odd sandwich, and it was delicious.', { effects: { happiness: 2 }, closeness: { child: 5 } }),
        o('{child} said it needed more chilli, and it did.', { effects: { happiness: 1 }, closeness: { child: 3 } }),
        o('You dropped the plate, and {child} laughed so hard that the snack was forgotten.', { effects: { stress: 2 }, closeness: { child: 2 } }),
      ]),
      act('late', 'Say it is late', 75, [
        o('{child} nodded, said goodnight, and you got some peace.', { effects: { stress: -1 }, closeness: { child: 1 } }),
        o('{child} went off with a big sigh.', { effects: { stress: 1 } }),
        o('{child} grumbled for an hour, and you gave in to snacks.', { effects: { stress: 3 }, closeness: { child: -1 } }),
      ]),
    ],
  },
  {
    id: 'child-funny', kind: 'news', stages: FAMILY_STAGES, weight: 2, cast: { child: 'child' },
    title: '{child} is funny', text: 'Something {child} said today is going to be told at every family dinner.',
    news: { text: '{child} told a joke at dinner that had the whole table laughing, even the aunties.', effects: { happiness: 2 }, closeness: { child: 3 } },
  },
]

const propose = person('propose', 'Proposing to {them}', 'You have thought about it for a long time. You want to ask {them} to marry you.', [
  act('ring', 'Propose over dinner', 70, [
    o('{them} said yes before you finished the question. Now there is a wedding to plan.', { effects: { happiness: 8 }, closeness: { them: 10 } }),
    o('{them} said they need a little more time, with a smile.', { effects: { happiness: 1, stress: 2 }, closeness: { them: 3 } }),
    o('{them} said not yet, kindly. The dinner got very quiet.', { effects: { happiness: -5 }, closeness: { them: -6 } }),
  ]),
  act('home', 'Ask at home, with family nearby', 65, [
    o('Everybody cheered when {them} said yes. The aunties cried first.', { effects: { happiness: 8 }, closeness: { them: 10 } }),
    o('{them} wanted to talk it over first, and you both agreed it was fair.', { effects: { happiness: 1, stress: 2 }, closeness: { them: 3 } }),
    o('{them} felt a bit put on the spot. You will do it differently next time.', { effects: { happiness: -5 }, closeness: { them: -6 } }),
  ]),
  act('walk', 'Ask on a quiet walk', 75, [
    o('{them} stopped walking, laughed, and said yes.', { effects: { happiness: 8 }, closeness: { them: 10 } }),
    o('{them} held your hand and said "soon", which was almost an answer.', { effects: { happiness: 1, stress: 2 }, closeness: { them: 3 } }),
    o('{them} said not yet. You walked home slowly.', { effects: { happiness: -5 }, closeness: { them: -6 } }),
  ]),
])

// Queued by school.ts when SMP ends, never drawn at random; each outcome carries the path move it takes.
const fork = (path: string, ...texts: [string, string, string]): Tiers =>
  texts.map((text) => o(text, { path })) as Tiers
const afterSmp: EventDef = {
  id: 'after-smp', kind: 'choice', stages: ['early-teen', 'late-teen'], weight: 0,
  title: 'What comes after SMP?',
  text: 'SMP is behind you, and everyone has an opinion about what comes next. Your mother says SMA, your uncle says SMK, and the neighbour says to start earning.',
  actions: [
    act('sma', 'Go on to SMA', 60, fork('sma',
      'You chose SMA and bought a bag of new pens.',
      'You chose SMA, and everyone nodded as if they had known all along.',
      'You chose SMA. The first-day nerves lasted until lunch.')),
    act('smk', 'Go on to SMK', 60, fork('smk',
      'You chose SMK and picked a workshop that smells of sawdust.',
      'You chose SMK, and your uncle looked very pleased.',
      'You chose SMK. The uniform is stiff, but you will grow into it.')),
    act('work', 'Start working', 60, fork('leave-school',
      'You chose to work. A small pay packet beats a long summer holiday.',
      'You chose to work, and the neighbour finally stopped giving advice.',
      'You chose to work. It will not be easy, but it is yours.')),
  ],
}

// Queued by work.ts when a good year earns a step up; never drawn at random. Accepting carries the 'promote' move.
const promotion: EventDef = {
  id: 'promotion', kind: 'choice', stages: ['late-teen', 'young-adult', 'adult', 'senior'], weight: 0,
  title: 'A step up',
  text: 'Your boss calls you in. You have done good work as {job}, and there is an opening for {next}.',
  actions: [
    act('accept', 'Accept', 85, [
      o('You said yes. The new title looks good on the door.', { path: 'promote', effects: { happiness: 3 } }),
      o('You said yes, and now you are mostly wondering what the job involves.', { path: 'promote', effects: { stress: 2 } }),
      o('You said yes, a little too quietly. It still counts.', { path: 'promote' }),
    ]),
    act('raise', 'Ask for a bigger raise', 45, [
      o('You asked, and the boss laughed and agreed. The new pay comes with a small bonus.', { path: 'promote', raise: true, effects: { happiness: 4 } }),
      o('You asked, and the boss met you halfway. You are {next} now.', { path: 'promote', effects: { stress: 2 } }),
      o('You asked, and the boss frowned. The offer stays as it was, for now.', { effects: { reputation: -1 } }),
    ]),
    act('decline', 'Turn it down', 85, [
      o('You said no, thank you. You like the job you have.', { effects: { stress: -2 } }),
      o('You said no, and the boss looked puzzled.', {}),
      o('You said no and then spent the evening wondering why.', { effects: { stress: 2 } }),
    ]),
  ],
}

// Thin work news: each needs a job.
const workNews = (id: string, title: string, text: string, news: Partial<Outcome> = {}): EventDef =>
  ({ id, kind: 'news', stages: ['late-teen', 'young-adult', 'adult', 'senior'], weight: 2, when: [{ kind: 'job' }], title, text, news: { text, ...news } })
const jobNews: EventDef[] = [
  workNews('news-work-birthday', 'A cake at work', 'Someone brought a birthday cake to the office. You got the piece with the most icing.', { effects: { happiness: 3 } }),
  workNews('news-work-air-con', 'The air conditioning broke', 'The AC gave up on the hottest day of the month. Everyone worked in the doorway with a fan.', { effects: { stress: 3, happiness: -1 } }),
  workNews('news-work-thr', 'A small THR bonus', 'The holiday bonus came a little early this year. It is not much, but it is something.', { effects: { happiness: 3 }, money: 200_000 }),
  workNews('news-work-new-boss', 'A new boss', 'A new boss started on Monday. By Friday they knew everyone’s name and coffee order.', { effects: { reputation: 1, happiness: 1 } }),
  workNews('news-work-traffic', 'Stuck in traffic', 'A flooded road turned the ride to work into two hours. You arrived with wet shoes and a good podcast.', { effects: { stress: 3 } }),
  workNews('news-work-praise', 'A kind word', 'A customer wrote to say you were helpful. Your boss read it out in the morning meeting.', { effects: { reputation: 3, happiness: 3 } }),
]

export const events: EventDef[] = [...choices, ...news, ...jobNews, ...lifeNews, ...lifeChoices, ...people, propose, weddingEvent, ...family, afterSmp, promotion]
