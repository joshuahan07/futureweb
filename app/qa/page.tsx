'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeSync } from '@/lib/realtime'
import { useUser } from '@/components/UserContext'
import { seedIfEmpty } from '@/lib/seed'
import Layout from '@/components/Layout'
import { MessageCircle, Plus, ChevronRight } from 'lucide-react'
import AnswerPanel from '@/components/AnswerPanel'

interface Question {
  id: string
  question: string
  category: string | null
  order_index: number | null
}

interface Answer {
  id: string
  question_id: string
  answered_by: string
  answer: string
}

const SEED_QUESTIONS: { question: string; category: string; order_index: number }[] = [
  { question: 'How will we handle money when things get tight?', category: 'Financial', order_index: 1 },
  { question: 'Should we have joint accounts, separate accounts, or both?', category: 'Financial', order_index: 2 },
  { question: 'What are your financial goals for the next 5 years?', category: 'Financial', order_index: 3 },
  { question: 'How do you feel about lending money to family or friends?', category: 'Financial', order_index: 4 },
  { question: 'What is your approach to saving vs. spending?', category: 'Financial', order_index: 5 },
  { question: 'How much should we each contribute to shared expenses?', category: 'Financial', order_index: 6 },
  { question: 'Do you have any debts? How do you plan to handle them?', category: 'Credit & Debt', order_index: 7 },
  { question: 'What is your credit score and how do you feel about it?', category: 'Credit & Debt', order_index: 8 },
  { question: 'How do you feel about taking on debt for big purchases (house, car)?', category: 'Credit & Debt', order_index: 9 },
  { question: 'Do you want children? If so, how many and when?', category: 'Parenting', order_index: 10 },
  { question: 'What parenting style do you lean toward?', category: 'Parenting', order_index: 11 },
  { question: 'How would we handle disagreements about parenting?', category: 'Parenting', order_index: 12 },
  { question: 'What values are most important to instill in our children?', category: 'Parenting', order_index: 13 },
  { question: 'How do you feel about childcare and stay-at-home parenting?', category: 'Parenting', order_index: 14 },
  { question: 'Where do you see us living in 10 years?', category: 'Dream Life', order_index: 15 },
  { question: 'What does your ideal daily routine look like?', category: 'Dream Life', order_index: 16 },
  { question: 'What is your biggest dream or life goal?', category: 'Dream Life', order_index: 17 },
  { question: 'What does retirement look like for you?', category: 'Dream Life', order_index: 18 },
  { question: 'What are your biggest fears in a relationship?', category: 'Likes / Dislikes / Fears', order_index: 19 },
  { question: 'What habits of mine do you find most endearing?', category: 'Likes / Dislikes / Fears', order_index: 20 },
  { question: 'What is something I do that bothers you but you haven\'t mentioned?', category: 'Likes / Dislikes / Fears', order_index: 21 },
  { question: 'What are your love languages in order of importance?', category: 'Likes / Dislikes / Fears', order_index: 22 },
  { question: 'How do you want to handle holidays and family visits?', category: 'Expectations', order_index: 23 },
  { question: 'What does a perfect weekend together look like?', category: 'Expectations', order_index: 24 },
  { question: 'How much alone time do you need?', category: 'Expectations', order_index: 25 },
  { question: 'What are your expectations around household chores?', category: 'Expectations', order_index: 26 },
  { question: 'How do you want to resolve conflicts?', category: 'Expectations', order_index: 27 },
  { question: 'What role does faith or spirituality play in your life?', category: 'Beliefs', order_index: 28 },
  { question: 'Are there any non-negotiable values or principles you hold?', category: 'Beliefs', order_index: 29 },
  { question: 'How do you feel about raising children with a specific faith?', category: 'Beliefs', order_index: 30 },
]

const DEFAULT_CATEGORIES = [
  'All', 'Financial', 'Credit & Debt', 'Parenting',
  'Dream Life', 'Likes / Dislikes / Fears', 'Expectations', 'Beliefs',
]

const CAT_ICONS: Record<string, string> = {
  'Financial': '💰', 'Credit & Debt': '💳', 'Parenting': '👶',
  'Dream Life': '✨', 'Likes / Dislikes / Fears': '💭', 'Expectations': '🤝', 'Beliefs': '🕊',
}

export default function QAPage() {
  const { currentUser } = useUser()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newCategory, setNewCategory] = useState('Financial')
  const [customCategory, setCustomCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const fetchQuestions = useCallback(async () => {
    const { data } = await supabase.from('qa_questions').select('*').order('order_index', { ascending: true })
    if (data) setQuestions(data)
    return data
  }, [])

  const fetchAnswers = useCallback(async () => {
    const { data } = await supabase.from('qa_answers').select('*')
    if (data) setAnswers(data)
  }, [])

  const fetchAll = useCallback(async () => {
    const qs = await fetchQuestions()
    await fetchAnswers()
    return qs
  }, [fetchQuestions, fetchAnswers])

  useEffect(() => {
    async function init() {
      await seedIfEmpty('qa_questions', SEED_QUESTIONS.map((q) => ({ ...q, created_by: 'joshua' })))
      await fetchAll()
      setLoaded(true)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useRealtimeSync('qa_questions', fetchQuestions)
  useRealtimeSync('qa_answers', fetchAnswers)

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }

  // Dynamic categories from data
  const liveCats = [...new Set(questions.map((q) => q.category).filter(Boolean))] as string[]
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...liveCats])]

  const filteredQuestions = activeCategory === 'All' ? questions : questions.filter((q) => q.category === activeCategory)
  const groupedByCategory = filteredQuestions.reduce<Record<string, Question[]>>((acc, q) => {
    const cat = q.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(q)
    return acc
  }, {})

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim() || !currentUser) return
    setSaving(true)
    const finalCategory = newCategory === '__custom__' ? customCategory.trim() : newCategory
    if (!finalCategory) { setSaving(false); return }
    await supabase.from('qa_questions').insert({
      question: newQuestion.trim(), category: finalCategory, order_index: null, created_by: currentUser,
    })
    setSaving(false)
    setNewQuestion(''); setCustomCategory(''); setNewCategory('Financial'); setShowAddQuestion(false)
    await fetchQuestions()
  }

  // Stats
  const totalQuestions = questions.length
  const answeredByJoshua = questions.filter((q) => answers.some((a) => a.question_id === q.id && a.answered_by === 'joshua')).length
  const answeredBySophie = questions.filter((q) => answers.some((a) => a.question_id === q.id && a.answered_by === 'sophie')).length

  if (!loaded) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-mauve/40 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading text-foreground flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-rose" />
              Q&A Journal
            </h1>
            <p className="text-sm text-muted mt-1">Questions to explore together</p>
          </div>
          <button onClick={() => setShowAddQuestion(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-mauve text-white text-sm font-medium hover:bg-mauve/90 active:scale-95 transition-all shadow-lg shadow-mauve/25">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalQuestions}</div>
            <div className="text-[10px] text-muted uppercase tracking-wider">Questions</div>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 border border-mauve/15 text-center">
            <div className="text-2xl font-bold text-mauve">{answeredByJoshua}</div>
            <div className="text-[10px] text-mauve/80 uppercase tracking-wider">Joshua answered</div>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-rose-500">{answeredBySophie}</div>
            <div className="text-[10px] text-rose-400 uppercase tracking-wider">Sophie answered</div>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {allCategories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-mauve to-mauve/90 text-white shadow-sm'
                  : 'glass text-muted hover:text-foreground'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Questions grouped by category */}
        <div className="space-y-8">
          {Object.entries(groupedByCategory).map(([category, qs]) => {
            const answered = qs.filter((q) => answers.some((a) => a.question_id === q.id)).length
            const isCollapsed = collapsedCategories.has(category)
            const icon = CAT_ICONS[category] || '📋'

            return (
              <div key={category}>
                <button onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2.5 mb-4 group w-full text-left">
                  <ChevronRight className={`w-4 h-4 text-muted transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                  <span className="text-lg">{icon}</span>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60 group-hover:text-foreground transition-colors">
                    {category}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-xl glass text-muted font-medium">
                    {answered}/{qs.length} answered
                  </span>
                  <div className="flex-1 h-px bg-border ml-2" />
                </button>

                {!isCollapsed && (
                  <div className="space-y-4 ml-2">
                    {qs.map((q) => {
                      const joshuaAnswer = answers.find((a) => a.question_id === q.id && a.answered_by === 'joshua') || null
                      const sophieAnswer = answers.find((a) => a.question_id === q.id && a.answered_by === 'sophie') || null

                      return (
                        <div key={q.id} className="rounded-2xl glass-card overflow-hidden hover:shadow-sm transition-shadow">
                          {/* Question header */}
                          <div className="px-5 py-4 bg-gradient-to-r from-mauve/5 to-rose/5 border-b border-border">
                            <p className="text-center font-medium italic text-foreground/80 text-sm leading-relaxed">
                              &ldquo;{q.question}&rdquo;
                            </p>
                          </div>
                          {/* Answer panels */}
                          <div className="p-4 flex flex-col sm:flex-row gap-4">
                            <AnswerPanel
                              questionId={q.id} person="joshua" currentUser={currentUser}
                              existingAnswer={joshuaAnswer ? { id: joshuaAnswer.id, answer: joshuaAnswer.answer } : null}
                            />
                            <AnswerPanel
                              questionId={q.id} person="sophie" currentUser={currentUser}
                              existingAnswer={sophieAnswer ? { id: sophieAnswer.id, answer: sophieAnswer.answer } : null}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {Object.keys(groupedByCategory).length === 0 && (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted">No questions match this category</p>
          </div>
        )}
      </div>

      {/* Add question modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
          <form onSubmit={handleAddQuestion}
            className="glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-fade-in border border-border">
            <h2 className="font-heading text-xl text-foreground">Add a Question</h2>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Question</label>
              <textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:ring-2 focus:ring-mauve/20 outline-none resize-none"
                rows={3} placeholder="Type your question..." required />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Category</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:ring-2 focus:ring-mauve/20 outline-none">
                {allCategories.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__custom__">+ Custom Category...</option>
              </select>
              {newCategory === '__custom__' && (
                <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:ring-2 focus:ring-mauve/20 outline-none mt-2"
                  placeholder="Enter category name..." autoFocus />
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAddQuestion(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted hover:bg-surface-hover transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  newQuestion.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'
                } disabled:opacity-50`}>
                {saving ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  )
}
