"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { QuizHeader } from "@/components/quiz-header"
import { QuizProgress } from "@/components/quiz-progress"
import { QuestionDisplay } from "@/components/question-display"
import { AnswerOptions } from "@/components/answer-options"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

// Datos de ejemplo para el quiz
const quizData = {
  databases: {
    title: "Bases de Datos",
    color: "from-blue-500 to-cyan-500",
    questions: [
      {
        id: 1,
        type: "multiple",
        question: "¿Cuál de las siguientes afirmaciones sobre normalización de bases de datos es correcta?",
        options: [
          "La primera forma normal (1NF) elimina dependencias transitivas",
          "La segunda forma normal (2NF) requiere que todos los atributos no clave dependan de la clave completa",
          "La tercera forma normal (3NF) permite valores nulos en la clave primaria",
          "La forma normal de Boyce-Codd (BCNF) es menos restrictiva que 3NF",
        ],
        correctAnswer: 1,
        hasCode: false,
      },
      {
        id: 2,
        type: "boolean",
        question: "En SQL, la cláusula HAVING se utiliza para filtrar resultados antes de aplicar GROUP BY.",
        hasCode: false,
      },
      {
        id: 3,
        type: "multiple",
        question: "¿Qué resultado produce la siguiente consulta SQL?",
        code: `SELECT COUNT(*) as total
FROM usuarios u
LEFT JOIN pedidos p ON u.id = p.usuario_id
WHERE p.fecha > '2024-01-01'
GROUP BY u.id
HAVING COUNT(p.id) > 5;`,
        codeLanguage: "sql",
        options: [
          "Cuenta todos los usuarios que tienen más de 5 pedidos después del 1 de enero de 2024",
          "Cuenta el total de pedidos realizados después del 1 de enero de 2024",
          "Muestra los usuarios con exactamente 5 pedidos",
          "Genera un error de sintaxis",
        ],
        correctAnswer: 0,
        hasCode: true,
      },
    ],
  },
  programming: {
    title: "Programación",
    color: "from-purple-500 to-pink-500",
    questions: [
      {
        id: 1,
        type: "multiple",
        question: "¿Cuál es la complejidad temporal del siguiente algoritmo de búsqueda binaria?",
        code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
        codeLanguage: "javascript",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        correctAnswer: 1,
        hasCode: true,
      },
      {
        id: 2,
        type: "boolean",
        question: "La herencia múltiple está permitida en Java.",
        hasCode: false,
      },
    ],
  },
  networks: {
    title: "Redes",
    color: "from-green-500 to-emerald-500",
    questions: [
      {
        id: 1,
        type: "multiple",
        question: "¿Qué protocolo opera en la capa de transporte del modelo OSI?",
        options: ["HTTP", "TCP", "IP", "Ethernet"],
        correctAnswer: 1,
        hasCode: false,
      },
      {
        id: 2,
        type: "boolean",
        question: "El protocolo HTTPS utiliza el puerto 443 por defecto.",
        hasCode: false,
      },
      {
        id: 3,
        type: "multiple",
        question: "Observa el siguiente diagrama de red. ¿Cuál es la topología representada?",
        image: "/network-topology-star-diagram.jpg",
        options: ["Topología en Bus", "Topología en Estrella", "Topología en Anillo", "Topología en Malla"],
        correctAnswer: 1,
        hasImage: true,
      },
    ],
  },
  architecture: {
    title: "Arquitectura",
    color: "from-orange-500 to-red-500",
    questions: [
      {
        id: 1,
        type: "multiple",
        question: "¿Cuál de los siguientes NO es un principio SOLID?",
        options: [
          "Single Responsibility Principle",
          "Open/Closed Principle",
          "Liskov Substitution Principle",
          "Dynamic Inheritance Principle",
        ],
        correctAnswer: 3,
        hasCode: false,
      },
      {
        id: 2,
        type: "boolean",
        question: "En el patrón MVC, el Controlador es responsable de la lógica de presentación.",
        hasCode: false,
      },
      {
        id: 3,
        type: "multiple",
        question: "Analiza el siguiente diagrama UML. ¿Qué patrón de diseño representa?",
        image: "/uml-singleton-pattern-class-diagram.jpg",
        options: ["Patrón Singleton", "Patrón Factory", "Patrón Observer", "Patrón Strategy"],
        correctAnswer: 0,
        hasImage: true,
      },
    ],
  },
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const category = params.category as string
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutos en segundos
  const [isAnswered, setIsAnswered] = useState(false)

  const quiz = quizData[category as keyof typeof quizData]

  useEffect(() => {
    if (!quiz) {
      router.push("/")
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Aquí se podría manejar el fin del tiempo
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quiz, router])

  if (!quiz) return null

  const question = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

  const handleConfirm = () => {
    if (selectedAnswer === null) return
    setIsAnswered(true)
    // Aquí se manejaría la lógica de verificación de respuesta
  }

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      router.push(`/quiz/${category}/results`)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <QuizHeader categoryTitle={quiz.title} timeLeft={timeLeft} color={quiz.color} />

      <div className="container mx-auto max-w-4xl px-4 py-6">
        <QuizProgress current={currentQuestion + 1} total={quiz.questions.length} progress={progress} />

        <div className="mt-6 space-y-6">
          <QuestionDisplay
            question={question.question}
            code={'code' in question ? question.code : undefined}
            codeLanguage={'codeLanguage' in question ? question.codeLanguage : undefined}
            image={'image' in question ? question.image : undefined}
            hasCode={question.hasCode}
            hasImage={'hasImage' in question ? question.hasImage : false}
          />

          <AnswerOptions
            type={question.type as "multiple" | "boolean"}
            options={question.options}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            isAnswered={isAnswered}
            correctAnswer={question.correctAnswer}
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
                {currentQuestion < quiz.questions.length - 1 ? "Siguiente Pregunta" : "Finalizar Quiz"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
