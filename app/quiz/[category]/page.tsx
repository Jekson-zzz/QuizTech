"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { QuizHeader } from "@/components/quiz-header"
import { QuizProgress } from "@/components/quiz-progress"
import { QuestionDisplay } from "@/components/question-display"
import { AnswerOptions } from "@/components/answer-options"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

type FetchedQuestion = {
	id: number
	question: string
	type: string
	options: Array<{ id: number; text: string; is_correct: number }>
}

export default function QuizPage() {
	const params = useParams()
	const router = useRouter()
	const category = params.category as string
	const [currentQuestion, setCurrentQuestion] = useState(0)
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
	const TOTAL_TIME = 600 // 10 minutos en segundos
	const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
	const [isAnswered, setIsAnswered] = useState(false)
	const [loading, setLoading] = useState(true)
	const [quizTitle, setQuizTitle] = useState<string | null>(null)
	const [questions, setQuestions] = useState<FetchedQuestion[]>([])
	const [answers, setAnswers] = useState<Array<number | null>>([])

	useEffect(() => {
		let mounted = true
		async function load() {
			setLoading(true)
			try {
				const res = await fetch(`/api/quiz/${encodeURIComponent(category)}`)
				if (res.status === 404) {
					router.push('/')
					return
				}
				const data = await res.json()
				if (!mounted) return
				if (data?.error) {
					console.error('API error', data.error)
					router.push('/')
					return
				}
				setQuizTitle(data.category?.name || `Categoria ${category}`)
				// Mapear preguntas al formato que el client espera
				const mapped: FetchedQuestion[] = (data.questions || []).map((q: any) => ({
					id: q.id,
					question: q.question,
					type: q.type || 'single',
					options: q.options || [],
				}))
				setQuestions(mapped)
				// inicializar array de respuestas
				setAnswers(new Array(mapped.length).fill(null))
			} catch (e) {
				console.error(e)
				router.push('/')
			} finally {
				if (mounted) setLoading(false)
			}
		}
		load()
		return () => { mounted = false }
	}, [category, router])

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(timer)
					return 0
				}
				return prev - 1
			})
		}, 1000)

		return () => clearInterval(timer)
	}, [])

	// Generar clientQuizId para este intento y guardarlo en sessionStorage (por pestaña)
	useEffect(() => {
		try {
			if (typeof window === 'undefined') return
			const existing = sessionStorage.getItem('clientQuizId')
			if (!existing) {
				const id = 'quiz-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
				sessionStorage.setItem('clientQuizId', id)
			}
		} catch (e) {
			// noop
		}
	}, [])

	if (loading) {
		return <div>Cargando quiz...</div>
	}

	if (!questions || questions.length === 0) {
		return <div>No hay preguntas para esta categoría.</div>
	}

	const question = questions[currentQuestion]
	const progress = ((currentQuestion + 1) / questions.length) * 100

	// calcular índice de respuesta correcta si existe (opcional)
	const correctAnswerIndex = question.options.findIndex((o) => o.is_correct === 1)

	const handleConfirm = () => {
		if (selectedAnswer === null) return
		// Guardar respuesta en el array de respuestas
		const next = [...answers]
		next[currentQuestion] = selectedAnswer
		setAnswers(next)
		setIsAnswered(true)
		// lógica adicional: podríamos POSTear respuestas al backend aquí
	}

	const handleNext = () => {
		if (currentQuestion < questions.length - 1) {
			setCurrentQuestion(currentQuestion + 1)
			// Restaurar selección previa si existe
			setSelectedAnswer(answers[currentQuestion + 1] ?? null)
			setIsAnswered(false)
		} else {
			// Finalizar: construir resultado y guardarlo en sessionStorage para la página de resultados
			const totalQuestions = questions.length
			let correctCount = 0
			const details = questions.map((q, idx) => {
				const sel = answers[idx]
				const correctIdx = q.options.findIndex((o) => o.is_correct === 1)
				const isCorrect = sel !== null && sel === correctIdx
				if (isCorrect) correctCount++
				return {
					id: q.id,
					question: q.question,
					selected: sel,
					correctAnswer: correctIdx,
					correct: isCorrect,
					options: q.options.map((o) => ({ id: o.id, text: o.text })),
				}
			})
			const score = Math.round((correctCount / Math.max(1, totalQuestions)) * 100)
			const timeSpent = TOTAL_TIME - timeLeft
			const resultObj = {
				score,
				correctAnswers: correctCount,
				totalQuestions,
				timeSpent,
				category,
				details,
			}
			try {
				if (typeof window !== 'undefined') sessionStorage.setItem('lastQuizResult', JSON.stringify(resultObj))
			} catch (e) {
				// noop
			}
			router.push(`/quiz/${category}/results`)
		}
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
			<QuizHeader categoryTitle={quizTitle || ''} timeLeft={timeLeft} color={'from-blue-500 to-cyan-500'} />

			<div className="container mx-auto max-w-4xl px-4 py-6">
				<QuizProgress current={currentQuestion + 1} total={questions.length} progress={progress} />

				<div className="mt-6 space-y-6">
					<QuestionDisplay
						question={question.question}
						hasCode={false}
					/>

					<AnswerOptions
						type={question.type as "multiple" | "boolean"}
						options={question.options.map((o) => o.text)}
						selectedAnswer={selectedAnswer}
						onSelect={setSelectedAnswer}
						isAnswered={isAnswered}
						correctAnswer={correctAnswerIndex}
					/>

					<div className="flex justify-end">
						{!isAnswered ? (
							<Button
								size="lg"
								onClick={handleConfirm}
								disabled={selectedAnswer === null}
								className="min-w-[200px] bg-linear-to-r from-primary to-accent hover:opacity-90"
							>
								<CheckCircle className="mr-2 h-5 w-5" />
								Confirmar Respuesta
							</Button>
						) : (
							<Button
								size="lg"
								onClick={handleNext}
								className="min-w-[200px] bg-linear-to-r from-primary to-accent hover:opacity-90"
							>
								{currentQuestion < questions.length - 1 ? "Siguiente Pregunta" : "Finalizar Quiz"}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

