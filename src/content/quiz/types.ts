export type QuizSubject = 'maths' | 'science' | 'english' | 'indonesia' | 'general' | 'chat'
export interface QuizQuestion {
  id: string
  subject: QuizSubject
  level: 'sd' | 'smp' | 'sma'
  prompt: string
  choices: [string, string, string, string]
  answer: 0 | 1 | 2 | 3
}
