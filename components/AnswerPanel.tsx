'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Check } from 'lucide-react'

interface Props {
  questionId: string
  person: 'joshua' | 'sophie'
  currentUser: string | null
  existingAnswer: { id: string; answer: string } | null
}

export default function AnswerPanel({ questionId, person, currentUser, existingAnswer }: Props) {
  const isOwner = currentUser === person
  const [text, setText] = useState(existingAnswer?.answer || '')
  const [saved, setSaved] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answerId = useRef(existingAnswer?.id || null)
  const savingRef = useRef(false)

  useEffect(() => {
    setText(existingAnswer?.answer || '')
    answerId.current = existingAnswer?.id || null
  }, [existingAnswer])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const saveAnswer = useCallback(
    async (value: string) => {
      if (!currentUser || savingRef.current) return
      savingRef.current = true
      try {
        if (answerId.current) {
          await supabase.from('qa_answers').update({ answer: value }).eq('id', answerId.current)
        } else {
          const { data } = await supabase
            .from('qa_answers')
            .insert({ question_id: questionId, answered_by: person, answer: value, created_by: currentUser })
            .select().single()
          if (data) answerId.current = data.id
        }
        setSaved(true)
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
        savedTimerRef.current = setTimeout(() => setSaved(false), 2500)
      } finally {
        savingRef.current = false
      }
    },
    [questionId, person, currentUser]
  )

  const handleChange = (value: string) => {
    setText(value)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveAnswer(value)
      saveTimerRef.current = null
    }, 500)
  }

  const isJoshua = person === 'joshua'
  const label = isJoshua ? 'Joshua' : 'Sophie'

  return (
    <div className={`flex-1 rounded-xl p-4 min-w-0 transition-all duration-200 border ${
      isJoshua
        ? 'bg-blue-50/50 border-mauve/15'
        : 'bg-rose-50/50 border-rose-100'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
          isJoshua ? 'bg-blue-400' : 'bg-rose-400'
        }`}>
          {label[0]}
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {saved && (
          <span className="text-xs text-sage ml-auto font-medium flex items-center gap-1 animate-saved-pop">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </div>

      {isOwner ? (
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => {
            if (saveTimerRef.current) {
              clearTimeout(saveTimerRef.current)
              saveTimerRef.current = null
              saveAnswer(text)
            }
          }}
          className={`w-full min-h-[100px] p-3 rounded-lg border bg-surface/70 text-foreground text-sm leading-relaxed resize-y outline-none transition-colors ${
            isJoshua
              ? 'border-mauve/20 focus:ring-2 focus:ring-mauve/20'
              : 'border-rose-200 focus:ring-2 focus:ring-rose-200'
          }`}
          placeholder="Type your answer..."
        />
      ) : text ? (
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{text}</p>
      ) : (
        <p className="text-sm text-muted italic">
          {`${label} hasn't answered this yet...`}
        </p>
      )}
    </div>
  )
}
