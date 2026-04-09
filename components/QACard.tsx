'use client'

import AnswerPanel from './AnswerPanel'

interface Answer {
  id: string
  answered_by: string
  answer: string
}

interface Question {
  id: string
  question: string
  category: string | null
}

interface Props {
  question: Question
  answers: Answer[]
  currentUser: string | null
}

export default function QACard({ question, answers, currentUser }: Props) {
  const joshuaAnswer = answers.find((a) => a.answered_by === 'joshua') || null
  const sophieAnswer = answers.find((a) => a.answered_by === 'sophie') || null

  return (
    <div className="rounded-2xl bg-surface border border-amber-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/40">
        <p className="text-center font-semibold italic text-foreground/80 text-base leading-relaxed">
          &ldquo;{question.question}&rdquo;
        </p>
      </div>
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        <AnswerPanel
          questionId={question.id}
          person="joshua"
          currentUser={currentUser}
          existingAnswer={joshuaAnswer ? { id: joshuaAnswer.id, answer: joshuaAnswer.answer } : null}
        />
        <AnswerPanel
          questionId={question.id}
          person="sophie"
          currentUser={currentUser}
          existingAnswer={sophieAnswer ? { id: sophieAnswer.id, answer: sophieAnswer.answer } : null}
        />
      </div>
    </div>
  )
}
