import type { QuizQuestion, QuizSubject } from './types'

// The right answer is listed first; questionsFor shuffles the choices before they are shown.
const q = (id: string, subject: QuizSubject, level: QuizQuestion['level'], prompt: string, right: string, ...wrong: [string, string, string]): QuizQuestion => ({
  id, subject, level, prompt, choices: [right, ...wrong], answer: 0,
})

export const QUESTIONS: QuizQuestion[] = [
  q('maths-linear', 'maths', 'sma', 'If 2x + 3 = 11, what is x?', '4', '3', '5', '7'),
  q('maths-derivative', 'maths', 'sma', 'What is the derivative of x²?', '2x', 'x', 'x³', '2'),
  q('maths-log', 'maths', 'sma', 'What is log₁₀ 1000?', '3', '10', '100', '4'),
  q('maths-triangle', 'maths', 'sma', 'The angles of a triangle add up to?', '180°', '90°', '270°', '360°'),
  q('maths-sqrt', 'maths', 'sma', 'What is √144?', '12', '14', '11', '16'),
  q('maths-power', 'maths', 'sma', 'What is 2⁵?', '32', '16', '25', '64'),
  q('maths-sine', 'maths', 'sma', 'What is sin 90°?', '1', '0', '0.5', '−1'),
  q('maths-slope', 'maths', 'sma', 'What is the slope of y = 3x + 2?', '3', '2', '5', '1/3'),

  q('science-sodium', 'science', 'sma', 'What is the chemical symbol for sodium?', 'Na', 'So', 'S', 'Sd'),
  q('science-mitochondria', 'science', 'sma', 'Which part of a cell releases energy from food?', 'Mitochondria', 'Nucleus', 'Cell wall', 'Vacuole'),
  q('science-newton', 'science', 'sma', 'What is the SI unit of force?', 'Newton', 'Joule', 'Watt', 'Pascal'),
  q('science-ph', 'science', 'sma', 'What is the pH of pure water at 25 °C?', '7', '0', '1', '14'),
  q('science-photosynthesis', 'science', 'sma', 'Which gas do plants take in for photosynthesis?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Helium'),
  q('science-mercury', 'science', 'sma', 'Which planet is closest to the Sun?', 'Mercury', 'Venus', 'Mars', 'Earth'),
  q('science-carbon', 'science', 'sma', 'What is the atomic number of carbon?', '6', '4', '8', '12'),
  q('science-light', 'science', 'sma', 'About how fast does light travel?', 'About 300 thousand km/s', '3 thousand km/s', '30 thousand km/s', '30 km/s'),

  q('english-went', 'english', 'sma', 'What is the past tense of “go”?', 'went', 'goed', 'gone', 'going'),
  q('english-goes', 'english', 'sma', '“She ___ to school every day.”', 'goes', 'go', 'going', 'gone'),
  q('english-stingy', 'english', 'sma', 'What is the opposite of “generous”?', 'stingy', 'kind', 'wealthy', 'brave'),
  q('english-children', 'english', 'sma', 'What is the plural of “child”?', 'children', 'childs', 'childes', 'childen'),
  q('english-adverb', 'english', 'sma', 'Which word is an adverb?', 'happily', 'happy', 'happiness', 'unhappy'),
  q('english-since', 'english', 'sma', '“I have lived here ___ 2010.”', 'since', 'for', 'during', 'at'),
  q('english-enormous', 'english', 'sma', 'Which word means the same as “huge”?', 'enormous', 'tiny', 'narrow', 'quiet'),
  q('english-were', 'english', 'sma', '“If I ___ rich, I would travel.”', 'were', 'am', 'be', 'been'),

  q('indonesia-independence', 'indonesia', 'sma', 'When did Indonesia proclaim independence?', '17 August 1945', '17 August 1949', '1 June 1945', '28 October 1928'),
  q('indonesia-youth-pledge', 'indonesia', 'sma', 'In which year was the Youth Pledge made?', '1928', '1908', '1945', '1966'),
  q('indonesia-motto', 'indonesia', 'sma', 'What does “Bhinneka Tunggal Ika” mean?', 'Unity in diversity', 'Freedom or death', 'Work and pray', 'Land and water'),
  q('indonesia-pancasila', 'indonesia', 'sma', 'How many principles does Pancasila have?', '5', '4', '6', '7'),
  q('indonesia-borobudur', 'indonesia', 'sma', 'Borobudur temple is in which province?', 'Central Java', 'East Java', 'Bali', 'West Java'),
  q('indonesia-rupiah', 'indonesia', 'sma', 'What is Indonesia’s currency?', 'Rupiah', 'Ringgit', 'Baht', 'Peso'),
  q('indonesia-borneo', 'indonesia', 'sma', 'Which island do Indonesia, Malaysia and Brunei share?', 'Borneo', 'Sumatra', 'Sulawesi', 'Java'),
  q('indonesia-komodo', 'indonesia', 'sma', 'Wild Komodo dragons live in which province?', 'East Nusa Tenggara', 'Bali', 'West Java', 'Riau'),
  q('indonesia-bandung', 'indonesia', 'sma', 'Which city hosted the 1955 Asian–African Conference?', 'Bandung', 'Jakarta', 'Surabaya', 'Medan'),
  q('indonesia-puncak-jaya', 'indonesia', 'sma', 'What is Indonesia’s highest mountain?', 'Puncak Jaya', 'Rinjani', 'Semeru', 'Kerinci'),

  q('general-leap-year', 'general', 'smp', 'How many days are in a leap year?', '366', '365', '364', '367'),
  q('general-pacific', 'general', 'smp', 'Which is the largest ocean?', 'Pacific', 'Atlantic', 'Indian', 'Arctic'),
  q('general-blue-whale', 'general', 'smp', 'Which is the largest animal alive?', 'Blue whale', 'African elephant', 'Giraffe', 'Whale shark'),
  q('general-green', 'general', 'sd', 'Blue and yellow paint mix to make?', 'Green', 'Purple', 'Orange', 'Brown'),
  q('general-tokyo', 'general', 'smp', 'What is the capital of Japan?', 'Tokyo', 'Osaka', 'Kyoto', 'Seoul'),
  q('general-hexagon', 'general', 'sd', 'How many sides does a hexagon have?', '6', '5', '7', '8'),
  q('general-cheetah', 'general', 'smp', 'Which is the fastest land animal?', 'Cheetah', 'Lion', 'Horse', 'Elephant'),
  q('general-hours', 'general', 'sd', 'How many hours are in a day?', '24', '12', '20', '60'),

  q('chat-lunch', 'chat', 'smp', 'Someone new sits next to you at lunch. What do you say?', 'Hi! Glad you joined us. What’s your name?', 'That seat is for my bag.', 'Do you like staplers?', 'Eat quietly, please.'),
  q('chat-drawing', 'chat', 'smp', 'A classmate shows you a drawing. What do you say?', 'I love the colours! How long did it take?', 'Mine would be better.', 'Is it upside down?', 'I had rice for breakfast.'),
  q('chat-failed-test', 'chat', 'smp', 'A friend failed a test. What do you say?', 'That’s tough. Want to study together next time?', 'Ha, I passed.', 'Tests are for robots.', 'What time is it?'),
  q('chat-door', 'chat', 'smp', 'Someone holds the door for you. What do you say?', 'Thanks, that’s kind of you!', 'Took you long enough.', 'Doors are overrated.', 'I prefer windows.'),
  q('chat-bump', 'chat', 'smp', 'You bump into someone in the hallway. What do you say?', 'Oh, sorry! Are you okay?', 'Watch where you’re going.', 'Nice shoes. Bye.', 'Hallways are too narrow.'),
  q('chat-neighbour', 'chat', 'smp', 'A new neighbour says hello. What do you say?', 'Hello, welcome! I live next door.', 'Who are you?', 'Please keep the noise down.', 'I collect bottle caps.'),
  q('chat-club', 'chat', 'smp', 'A friend got into their favourite club. What do you say?', 'Congratulations! You worked hard for that.', 'I could have got in too.', 'Clubs are boring.', 'Have you seen my pen?'),
  q('chat-nervous', 'chat', 'smp', 'A friend is nervous before a show. What do you say?', 'You’ve practised a lot. You’ll do great!', 'Everyone will be watching you.', 'Just don’t mess up.', 'I’m hungry.'),
  q('chat-missed-goal', 'chat', 'smp', 'A teammate misses a shot in futsal. What do you say?', 'Unlucky! The next one’s yours.', 'You should have passed to me.', 'Is it lunch yet?', 'Goals are too small anyway.'),
  q('chat-book', 'chat', 'smp', 'A friend lends you a book. What do you say?', 'Thank you! I’ll take good care of it.', 'I’ll probably lose it.', 'Is that all you have?', 'Books smell funny.'),
  q('chat-directions', 'chat', 'smp', 'Someone asks you the way, but you don’t know. What do you say?', 'Sorry, I’m not sure. Let’s ask at the shop.', 'Figure it out yourself.', 'Just keep walking left.', 'I like turtles.'),
  q('chat-birthday', 'chat', 'smp', 'It’s a classmate’s birthday. What do you say?', 'Happy birthday! Hope you have a great day.', 'So you’re old now?', 'I forgot. Whatever.', 'Birthdays are just Tuesdays.'),
]
