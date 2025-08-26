import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { analysisData, patientInfo } = await request.json()

    if (!analysisData) {
      return NextResponse.json({ error: "Dados de análise não fornecidos" }, { status: 400 })
    }

    // Gerar relatório em formato estruturado
    const report = {
      id: `REL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      patient: patientInfo || { name: "Paciente", age: null },
      analysis: analysisData,
      summary: generateSummary(analysisData),
      recommendations: analysisData.recommendations,
      followUp: generateFollowUpPlan(analysisData),
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error("Erro na geração do relatório:", error)
    return NextResponse.json(
      {
        error: "Erro durante a geração do relatório",
      },
      { status: 500 },
    )
  }
}

function generateSummary(analysisData: any): string {
  const { observations, limitations } = analysisData

  let summary = "RESUMO DA AVALIAÇÃO POSTURAL:\n\n"

  if (observations.length > 0) {
    summary += "PRINCIPAIS ACHADOS:\n"
    observations.forEach((obs: string, index: number) => {
      summary += `${index + 1}. ${obs}\n`
    })
    summary += "\n"
  }

  if (limitations.length > 0) {
    summary += "LIMITAÇÕES FUNCIONAIS:\n"
    limitations.forEach((lim: string, index: number) => {
      summary += `${index + 1}. ${lim}\n`
    })
    summary += "\n"
  }

  summary += "PRIORIDADES DE TRATAMENTO:\n"
  summary += "1. Correção de desequilíbrios musculares\n"
  summary += "2. Melhora da mobilidade articular\n"
  summary += "3. Fortalecimento da musculatura estabilizadora\n"
  summary += "4. Reeducação postural e funcional"

  return summary
}

function generateFollowUpPlan(analysisData: any): {
  shortTerm: string[]
  mediumTerm: string[]
  longTerm: string[]
} {
  return {
    shortTerm: [
      "Reavaliação postural em 2 semanas",
      "Monitoramento da dor e desconforto",
      "Adesão aos exercícios domiciliares",
    ],
    mediumTerm: [
      "Progressão dos exercícios de fortalecimento",
      "Avaliação funcional em 4-6 semanas",
      "Ajustes no plano de tratamento",
    ],
    longTerm: ["Manutenção dos ganhos obtidos", "Prevenção de recidivas", "Integração de atividades funcionais"],
  }
}
