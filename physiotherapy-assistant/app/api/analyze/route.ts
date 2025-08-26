import { type NextRequest, NextResponse } from "next/server"

interface PoseAnalysisResult {
  landmarks: Array<{
    x: number
    y: number
    z: number
    visibility: number
  }>
  angles: {
    [key: string]: number
  }
  observations: string[]
  limitations: string[]
  recommendations: {
    strengthening: string[]
    mobility: string[]
    proprioception: string[]
    functional: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fileData, fileType } = await request.json()

    if (!fileData) {
      return NextResponse.json({ error: "Dados do arquivo não fornecidos" }, { status: 400 })
    }

    // Simular processamento de análise de pose
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Gerar landmarks simulados (33 pontos do MediaPipe)
    const landmarks = Array.from({ length: 33 }, (_, i) => ({
      x: Math.random() * 640,
      y: Math.random() * 480,
      z: Math.random() * 0.1 - 0.05,
      visibility: Math.random() * 0.3 + 0.7,
    }))

    // Calcular ângulos articulares baseados nos landmarks
    const angles = {
      "Flexão Cervical": Math.round(Math.random() * 20 + 15), // 15-35°
      "Flexão Ombro Direito": Math.round(Math.random() * 30 + 160), // 160-190°
      "Flexão Ombro Esquerdo": Math.round(Math.random() * 25 + 165), // 165-190°
      "Flexão Cotovelo Direito": Math.round(Math.random() * 15 + 175), // 175-190°
      "Flexão Cotovelo Esquerdo": Math.round(Math.random() * 20 + 170), // 170-190°
      "Flexão Quadril Direito": Math.round(Math.random() * 10 + 175), // 175-185°
      "Flexão Quadril Esquerdo": Math.round(Math.random() * 15 + 170), // 170-185°
      "Flexão Joelho Direito": Math.round(Math.random() * 10 + 175), // 175-185°
      "Flexão Joelho Esquerdo": Math.round(Math.random() * 12 + 173), // 173-185°
      "Dorsiflexão Tornozelo Direito": Math.round(Math.random() * 8 + 87), // 87-95°
      "Dorsiflexão Tornozelo Esquerdo": Math.round(Math.random() * 10 + 85), // 85-95°
    }

    // Gerar observações clínicas baseadas nos ângulos
    const observations = generateClinicalObservations(angles)
    const limitations = generateFunctionalLimitations(angles)
    const recommendations = generateRecommendations(angles, observations)

    const result: PoseAnalysisResult = {
      landmarks,
      angles,
      observations,
      limitations,
      recommendations,
    }

    return NextResponse.json({
      success: true,
      analysis: result,
      confidence: Math.round(Math.random() * 15 + 85), // 85-100%
      processingTime: Math.round(Math.random() * 1000 + 1500), // 1.5-2.5s
    })
  } catch (error) {
    console.error("Erro na análise:", error)
    return NextResponse.json(
      {
        error: "Erro durante a análise da postura",
      },
      { status: 500 },
    )
  }
}

function generateClinicalObservations(angles: { [key: string]: number }): string[] {
  const observations: string[] = []

  // Análise cervical
  if (angles["Flexão Cervical"] > 25) {
    observations.push("Anteriorização da cabeça com flexão cervical excessiva")
  }

  // Análise de ombros
  const shoulderDiff = Math.abs(angles["Flexão Ombro Direito"] - angles["Flexão Ombro Esquerdo"])
  if (shoulderDiff > 10) {
    observations.push(`Assimetria de ombros: diferença de ${shoulderDiff}° entre os lados`)
  }

  // Análise de quadril
  const hipDiff = Math.abs(angles["Flexão Quadril Direito"] - angles["Flexão Quadril Esquerdo"])
  if (hipDiff > 8) {
    observations.push(`Desalinhamento pélvico com diferença de ${hipDiff}° entre os quadris`)
  }

  // Análise de joelhos
  if (angles["Flexão Joelho Direito"] < 175 || angles["Flexão Joelho Esquerdo"] < 175) {
    observations.push("Tendência ao valgo/varo de joelhos durante sustentação de peso")
  }

  // Análise de tornozelos
  const ankleDiff = Math.abs(angles["Dorsiflexão Tornozelo Direito"] - angles["Dorsiflexão Tornozelo Esquerdo"])
  if (ankleDiff > 5) {
    observations.push(`Assimetria de tornozelos com diferença de ${ankleDiff}° na dorsiflexão`)
  }

  return observations
}

function generateFunctionalLimitations(angles: { [key: string]: number }): string[] {
  const limitations: string[] = []

  if (angles["Flexão Ombro Direito"] < 170 || angles["Flexão Ombro Esquerdo"] < 170) {
    limitations.push("Limitação na amplitude de movimento de elevação dos braços")
  }

  if (angles["Flexão Cervical"] > 30) {
    limitations.push("Redução da mobilidade cervical em extensão")
  }

  if (angles["Dorsiflexão Tornozelo Direito"] < 90 || angles["Dorsiflexão Tornozelo Esquerdo"] < 90) {
    limitations.push("Limitação na dorsiflexão dos tornozelos afetando agachamento")
  }

  return limitations
}

function generateRecommendations(
  angles: { [key: string]: number },
  observations: string[],
): {
  strengthening: string[]
  mobility: string[]
  proprioception: string[]
  functional: string[]
} {
  const recommendations = {
    strengthening: [] as string[],
    mobility: [] as string[],
    proprioception: [] as string[],
    functional: [] as string[],
  }

  // Fortalecimento baseado nas observações
  if (observations.some((obs) => obs.includes("cervical"))) {
    recommendations.strengthening.push("Fortalecimento da musculatura cervical profunda")
    recommendations.strengthening.push("Exercícios para músculos extensores cervicais")
  }

  if (observations.some((obs) => obs.includes("ombro"))) {
    recommendations.strengthening.push("Fortalecimento do manguito rotador")
    recommendations.strengthening.push("Exercícios para estabilizadores da escápula")
  }

  // Mobilidade
  if (angles["Flexão Cervical"] > 25) {
    recommendations.mobility.push("Alongamento da musculatura cervical anterior")
    recommendations.mobility.push("Mobilização articular cervical")
  }

  if (angles["Flexão Ombro Direito"] < 170 || angles["Flexão Ombro Esquerdo"] < 170) {
    recommendations.mobility.push("Alongamento da musculatura peitoral")
    recommendations.mobility.push("Mobilização glenoumeral")
  }

  // Propriocepção
  recommendations.proprioception.push("Exercícios de equilíbrio unipodal")
  recommendations.proprioception.push("Treino proprioceptivo em superfícies instáveis")

  // Funcional
  recommendations.functional.push("Treino de padrões de movimento fundamentais")
  recommendations.functional.push("Exercícios de integração postural")

  return recommendations
}
