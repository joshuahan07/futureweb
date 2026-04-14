'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeSync } from '@/lib/realtime'
import { useUser } from '@/components/UserContext'
import { seedIfEmpty } from '@/lib/seed'
import Layout from '@/components/Layout'
import { MessageCircleQuestion, Plus, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Question { id: string; question: string; category: string | null; order_index: number | null; }
interface Answer { id: string; question_id: string; answered_by: string; answer: string; }

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

const CATEGORIES = ['All', 'Financial', 'Credit & Debt', 'Parenting', 'Dream Life', 'Likes / Dislikes / Fears', 'Expectations', 'Beliefs']

// ── Answer Panel (inline) ───────────────────────────────────

function AnswerBox({ questionId, person, currentUser, existingAnswer }: {
  questionId: string; person: 'joshua' | 'sophie'; currentUser: string | null;
  existingAnswer: { id: string; answer: string } | null;
}) {
  const isOwner = currentUser === person;
  const [text, setText] = useState(existingAnswer?.answer || '');
  const answerId = useRef(existingAnswer?.id || null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setText(existingAnswer?.answer || ''); answerId.current = existingAnswer?.id || null; }, [existingAnswer]);

  const save = useCallback(async (value: string) => {
    if (!currentUser) return;
    if (answerId.current) {
      await supabase.from('qa_answers').update({ answer: value }).eq('id', answerId.current);
    } else {
      const { data } = await supabase.from('qa_answers').insert({ question_id: questionId, answered_by: person, answer: value, created_by: currentUser }).select().single();
      if (data) answerId.current = data.id;
    }
  }, [questionId, person, currentUser]);

  const handleChange = (value: string) => {
    setText(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(value), 500);
  };

  const isJoshua = person === 'joshua';
  const label = isJoshua ? 'Joshua' : 'Sophie';
  const color = isJoshua ? 'blue' : 'pink';
  const pfp = typeof window !== 'undefined' ? localStorage.getItem(`js-pfp-${person}`) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full overflow-hidden border flex items-center justify-center text-[10px] font-bold text-white`}
          style={{ borderColor: isJoshua ? '#3B82F6' : '#EC4899', background: pfp ? undefined : (isJoshua ? '#3B82F6' : '#EC4899') }}>
          {pfp ? <img src={pfp} alt={label} className="w-full h-full object-cover" /> : label[0]}
        </div>
        <span className={`text-sm font-medium ${isJoshua ? 'text-blue-400' : 'text-pink-400'}`}>{label}&apos;s Answer</span>
      </div>
      {isOwner ? (
        <textarea value={text} onChange={(e) => handleChange(e.target.value)}
          placeholder="Write your answer..."
          className={`w-full min-h-[120px] p-4 rounded-xl border resize-none text-foreground placeholder:text-foreground/30 focus:outline-none ${
            isJoshua ? 'bg-blue-500/5 border-blue-500/20 focus:border-blue-500/40' : 'bg-pink-500/5 border-pink-500/20 focus:border-pink-500/40'
          }`} />
      ) : (
        <div className={`min-h-[120px] p-4 rounded-xl border ${isJoshua ? 'bg-blue-500/5 border-blue-500/20' : 'bg-pink-500/5 border-pink-500/20'}`}>
          {text ? <p className="text-foreground/80 whitespace-pre-wrap">{text}</p> : <p className="text-foreground/30 italic">{`Hasn't answered yet...`}</p>}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function QAPage() {
  const { currentUser } = useUser()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
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

  useEffect(() => {
    (async () => {
      await seedIfEmpty('qa_questions', SEED_QUESTIONS.map((q) => ({ ...q, created_by: 'joshua' })))
      await Promise.all([fetchQuestions(), fetchAnswers()])
      setLoaded(true)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useRealtimeSync('qa_questions', fetchQuestions)
  useRealtimeSync('qa_answers', fetchAnswers)

  const liveCats = [...new Set(questions.map((q) => q.category).filter(Boolean))] as string[]
  const allCategories = [...new Set([...CATEGORIES, ...liveCats])]
  const filteredQuestions = activeCategory === 'All' ? questions : questions.filter((q) => q.category === activeCategory)

  const answeredByJoshua = questions.filter((q) => answers.some((a) => a.question_id === q.id && a.answered_by === 'joshua')).length
  const answeredBySophie = questions.filter((q) => answers.some((a) => a.question_id === q.id && a.answered_by === 'sophie')).length

  const getCompletion = (qId: string) => {
    const j = answers.some((a) => a.question_id === qId && a.answered_by === 'joshua' && a.answer.trim())
    const s = answers.some((a) => a.question_id === qId && a.answered_by === 'sophie' && a.answer.trim())
    return (j ? 50 : 0) + (s ? 50 : 0)
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim() || !currentUser) return
    setSaving(true)
    const finalCategory = newCategory === '__custom__' ? customCategory.trim() : newCategory
    if (!finalCategory) { setSaving(false); return }
    await supabase.from('qa_questions').insert({ question: newQuestion.trim(), category: finalCategory, order_index: null, created_by: currentUser })
    setSaving(false)
    setNewQuestion(''); setCustomCategory(''); setNewCategory('Financial'); setShowAddQuestion(false)
    await fetchQuestions()
  }

  if (!loaded) return <Layout><div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-foreground/20 border-t-mauve rounded-full animate-spin" /></div></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MessageCircleQuestion className="w-8 h-8 text-purple-400" />
              Q&A Journal
            </h1>
            <p className="text-foreground/40 mt-1">Deep conversations and shared understanding</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats pill */}
            <div className="glass-card px-4 py-2 flex items-center gap-4">
              <div className="text-center"><p className="text-lg font-bold text-foreground">{questions.length}</p><p className="text-xs text-foreground/40">Questions</p></div>
              <div className="w-px h-8 bg-foreground/10" />
              <div className="text-center"><p className="text-lg font-bold text-blue-400">{answeredByJoshua}</p><p className="text-xs text-foreground/40">Joshua</p></div>
              <div className="w-px h-8 bg-foreground/10" />
              <div className="text-center"><p className="text-lg font-bold text-pink-400">{answeredBySophie}</p><p className="text-xs text-foreground/40">Sophie</p></div>
            </div>
            <motion.button onClick={() => setShowAddQuestion(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-medium">
              <Plus className="w-4 h-4" /> Add
            </motion.button>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <motion.button key={cat} onClick={() => setActiveCategory(cat)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-foreground/5 text-foreground/50 border border-foreground/10 hover:border-foreground/20'
              }`}>{cat}</motion.button>
          ))}
        </motion.div>

        {/* Questions — Accordion */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredQuestions.map((q, index) => {
              const isExpanded = expandedQuestion === q.id
              const completion = getCompletion(q.id)
              const joshuaAnswer = answers.find((a) => a.question_id === q.id && a.answered_by === 'joshua') || null
              const sophieAnswer = answers.find((a) => a.question_id === q.id && a.answered_by === 'sophie') || null
              const jAnswered = !!(joshuaAnswer && joshuaAnswer.answer.trim())
              const sAnswered = !!(sophieAnswer && sophieAnswer.answer.trim())

              return (
                <motion.div key={q.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.02 }}
                  className="glass-card overflow-hidden">

                  {/* Collapsed header */}
                  <button onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-foreground/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Progress ring */}
                      <div className="relative w-10 h-10 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                          <circle cx="20" cy="20" r="16" fill="none" stroke="url(#qaGrad)" strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${completion * 1.005} 100.5`} className="transition-all duration-500" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {completion === 100 ? <Check className="w-4 h-4 text-green-400" /> : <span className="text-[10px] text-foreground/50">{completion}%</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{q.question}</p>
                        <p className="text-sm text-foreground/40">{q.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex gap-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${jAnswered ? 'bg-blue-500/20 text-blue-400' : 'bg-foreground/5 text-foreground/20'}`}>J</div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${sAnswered ? 'bg-pink-500/20 text-pink-400' : 'bg-foreground/5 text-foreground/20'}`}>S</div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-foreground/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded answers */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                        className="border-t border-foreground/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                          <AnswerBox questionId={q.id} person="joshua" currentUser={currentUser}
                            existingAnswer={joshuaAnswer ? { id: joshuaAnswer.id, answer: joshuaAnswer.answer } : null} />
                          <AnswerBox questionId={q.id} person="sophie" currentUser={currentUser}
                            existingAnswer={sophieAnswer ? { id: sophieAnswer.id, answer: sophieAnswer.answer } : null} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-16 glass-card"><MessageCircleQuestion className="w-10 h-10 text-white/15 mx-auto mb-2" /><p className="text-foreground/30">No questions match</p></div>
        )}
      </div>

      {/* Add question modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
          <motion.form onSubmit={handleAddQuestion} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Add New Question</h2>
              <button type="button" onClick={() => setShowAddQuestion(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/5">✕</button>
            </div>
            <div>
              <label className="text-sm text-foreground/50 mb-2 block">Question *</label>
              <input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required autoFocus
                placeholder="What would you like to ask?"
                className="w-full px-3 py-2.5 rounded-xl glass border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20" />
            </div>
            <div>
              <label className="text-sm text-foreground/50 mb-2 block">Category</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass border border-foreground/10 text-foreground bg-transparent">
                {allCategories.filter((c) => c !== 'All').map((c) => <option key={c} value={c} className="bg-[#1a1a1f]">{c}</option>)}
                <option value="__custom__" className="bg-[#1a1a1f]">+ Custom...</option>
              </select>
              {newCategory === '__custom__' && (
                <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-lg glass border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none"
                  placeholder="Category name..." autoFocus />
              )}
            </div>
            <button type="submit" disabled={saving || !newQuestion.trim()}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                newQuestion.trim() ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white active:scale-95' : 'bg-foreground/5 text-foreground/30'
              }`}>{saving ? 'Adding...' : 'Add Question'}</button>
          </motion.form>
        </div>
      )}

      {/* SVG gradient for progress rings */}
      <svg width="0" height="0"><defs>
        <linearGradient id="qaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" /><stop offset="50%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs></svg>
    </Layout>
  )
}
