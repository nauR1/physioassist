"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dumbbell, Clock, Target, AlertTriangle } from "lucide-react"

interface Exercise {
  name: string
  description: string
  duration: string
  repetitions: string
  frequency: string
  precautions: string[]
  targetAreas: string[]
}

interface ExerciseTemplatesProps {
  analysisResults: any
  onExportExercises: (exercises: Exercise[]) => void
}

export function ExerciseTemplates({ analysisResults, onExportExercises }: ExerciseTemplatesProps) {
  const generateExercises = (): Exercise[] => {
    const exercises: Exercise[] = []

    // Based on analysis results, generate specific exercises
    if (analysisResults?.observations?.some((obs: string) => obs.includes("cervical") || obs.includes("cabeça"))) {
      exercises.push({
        name: "Retração Cervical",
        description: "Exercício para correção da postura da cabeça e fortalecimento da musculatura cervical profunda.",
        duration: "10 segundos por repetição",
        repetitions: "10-15 repetições",
        frequency: "3x ao dia",
        precautions: ["Não force o movimento", "Pare se sentir tontura"],
        targetAreas: ["Cervical", "Postura da cabeça"],
      })
    }

    if (analysisResults?.observations?.some((obs: string) => obs.includes("ombro") || obs.includes("escapular"))) {
      exercises.push({
        name: "Retração Escapular",
        description: "Fortalecimento dos músculos romboides e trapézio médio para correção da protração escapular.",
        duration: "5-8 segundos por contração",
        repetitions: "12-15 repetições",
        frequency: "2x ao dia",
        precautions: ["Mantenha os ombros relaxados", "Evite elevar os ombros"],
        targetAreas: ["Escapular", "Postura dos ombros"],
      })
    }

    if (analysisResults?.observations?.some((obs: string) => obs.includes("pélvico") || obs.includes("quadril"))) {
      exercises.push({
        name: "Basculação Pélvica",
        description: "Exercício para mobilização e controle da pelve, melhorando o alinhamento lombo-pélvico.",
        duration: "5 segundos em cada posição",
        repetitions: "10-12 repetições",
        frequency: "2-3x ao dia",
        precautions: ["Movimento lento e controlado", "Não force a amplitude"],
        targetAreas: ["Pelve", "Lombar"],
      })
    }

    if (analysisResults?.observations?.some((obs: string) => obs.includes("joelho") || obs.includes("valgo"))) {
      exercises.push({
        name: "Fortalecimento de Glúteo Médio",
        description: "Exercício em decúbito lateral para fortalecimento do glúteo médio e correção do valgo dinâmico.",
        duration: "3-5 segundos por elevação",
        repetitions: "15-20 repetições cada lado",
        frequency: "1x ao dia",
        precautions: ["Mantenha o alinhamento corporal", "Não rode o quadril"],
        targetAreas: ["Glúteo médio", "Estabilidade do joelho"],
      })
    }

    // Add general exercises
    exercises.push({
      name: "Alongamento de Cadeia Posterior",
      description: "Alongamento global da cadeia muscular posterior para melhora da flexibilidade.",
      duration: "30-60 segundos",
      repetitions: "3-4 repetições",
      frequency: "1x ao dia",
      precautions: ["Não force o alongamento", "Respire normalmente"],
      targetAreas: ["Flexibilidade geral", "Cadeia posterior"],
    })

    return exercises
  }

  const exercises = generateExercises()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Protocolo de Exercícios Personalizado</h3>
        <Button onClick={() => onExportExercises(exercises)} variant="outline">
          Exportar Protocolo
        </Button>
      </div>

      <div className="grid gap-4">
        {exercises.map((exercise, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                {exercise.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{exercise.description}</p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Duração</p>
                    <p className="text-sm text-muted-foreground">{exercise.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Repetições</p>
                    <p className="text-sm text-muted-foreground">{exercise.repetitions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Frequência</p>
                    <p className="text-sm text-muted-foreground">{exercise.frequency}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium text-sm mb-2">Áreas Alvo:</p>
                <div className="flex flex-wrap gap-1">
                  {exercise.targetAreas.map((area, idx) => (
                    <Badge key={idx} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              {exercise.precautions.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-yellow-800 dark:text-yellow-200">Precauções:</p>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {exercise.precautions.map((precaution, idx) => (
                          <li key={idx}>• {precaution}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
