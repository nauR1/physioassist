"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  Printer as Print,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Target,
  Calendar,
  User,
  Activity,
  Eye,
  Loader2,
  FileDown,
} from "lucide-react"
import { jsPDF } from "jspdf"

interface AnalysisResults {
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>
  angles: { [key: string]: number }
  observations: string[]
  limitations: string[]
  recommendations: {
    strengthening: string[]
    mobility: string[]
    proprioception: string[]
    functional: string[]
  }
  detailedAnalysis: {
    posturalDeviations: Array<{
      segment: string
      deviation: string
      severity: "leve" | "moderada" | "severa"
      compensation: string
    }>
    asymmetries: Array<{
      region: string
      description: string
      measurement: string
    }>
    functionalMovements: Array<{
      movement: string
      quality: "normal" | "alterado" | "limitado"
      observations: string
    }>
    riskFactors: string[]
    clinicalHypotheses: string[]
  }
  physiotherapyTests: Array<{
    testName: string
    indication: string
    expectedFindings: string
    clinicalRelevance: string
  }>
  confidence: number
}

interface ClinicalReportProps {
  results: AnalysisResults
  patientFile: File
  onBackToAnalysis: () => void
}

export function ClinicalReport({ results, patientFile, onBackToAnalysis }: ClinicalReportProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const getAngleValue = (angleName: string) => {
    return results.angles[angleName] || 0
  }

  const getAngleStatus = (angle: number, normalRange: [number, number]) => {
    if (angle < normalRange[0]) return { status: "baixo", color: "destructive" }
    if (angle > normalRange[1]) return { status: "alto", color: "destructive" }
    return { status: "normal", color: "secondary" }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getSeverityColor = (severity: "leve" | "moderada" | "severa") => {
    switch (severity) {
      case "leve":
        return "secondary"
      case "moderada":
        return "default"
      case "severa":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getQualityColor = (quality: "normal" | "alterado" | "limitado") => {
    switch (quality) {
      case "normal":
        return "secondary"
      case "alterado":
        return "default"
      case "limitado":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const handleExportReport = async () => {
    setIsGeneratingReport(true)

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysisData: results,
          patientInfo: {
            name: patientFile.name,
            analysisDate: currentDate,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao gerar relatório")
      }

      const reportData = await response.json()

      // Create downloadable report
      const reportContent = `
RELATÓRIO DE ANÁLISE POSTURAL
=============================

Data: ${currentDate}
Arquivo: ${patientFile.name}
Confiança: ${(results.confidence * 100).toFixed(1)}%

${reportData.report.summary}

ÂNGULOS ARTICULARES:
${Object.entries(results.angles)
  .map(([key, value]) => `- ${key}: ${value}°`)
  .join("\n")}

OBSERVAÇÕES CLÍNICAS:
${results.observations.map((obs, i) => `${i + 1}. ${obs}`).join("\n")}

LIMITAÇÕES FUNCIONAIS:
${results.limitations.map((lim, i) => `${i + 1}. ${lim}`).join("\n")}

RECOMENDAÇÕES DE TRATAMENTO:

Fortalecimento:
${results.recommendations.strengthening.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

Mobilidade:
${results.recommendations.mobility.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

Propriocepção:
${results.recommendations.proprioception.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

Funcional:
${results.recommendations.functional.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

PLANO DE ACOMPANHAMENTO:

Curto Prazo:
${reportData.report.followUp.shortTerm.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Médio Prazo:
${reportData.report.followUp.mediumTerm.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Longo Prazo:
${reportData.report.followUp.longTerm.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Relatório ID: ${reportData.report.id}
Gerado em: ${new Date().toLocaleString("pt-BR")}
      `

      const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `relatorio-fisioterapia-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
      // Fallback to simple export
      const simpleReport = {
        patient: patientFile.name,
        date: currentDate,
        analysis: results,
        timestamp: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(simpleReport, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `physio-report-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true)

    try {
      const doc = new jsPDF()

      doc.setFont("helvetica", "bold")
      doc.setFontSize(20)
      doc.setTextColor(34, 197, 94) // emerald-500

      doc.text("RELATÓRIO DE ANÁLISE POSTURAL", 20, 30)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)

      let yPos = 50
      doc.text(`Data: ${currentDate}`, 20, yPos)
      doc.text(`Arquivo: ${patientFile.name}`, 20, yPos + 10)
      doc.text(`Confiança: ${(results.confidence * 100).toFixed(1)}%`, 20, yPos + 20)

      yPos += 40

      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("ÂNGULOS ARTICULARES", 20, yPos)
      yPos += 15

      const angles = Object.entries(results.angles)
      const chartWidth = 160
      const chartHeight = 80
      const barHeight = chartHeight / angles.length - 2

      doc.setFillColor(248, 250, 252) // slate-50
      doc.rect(20, yPos, chartWidth, chartHeight, "F")

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)

      angles.forEach(([angleName, angleValue], index) => {
        const barY = yPos + index * (barHeight + 2)
        const barWidth = (angleValue / 180) * (chartWidth - 80) // Scale to 180 degrees max

        doc.setFillColor(34, 197, 94) // emerald-500
        doc.rect(80, barY, barWidth, barHeight, "F")

        doc.setTextColor(0, 0, 0)
        doc.text(angleName.substring(0, 15), 22, barY + barHeight / 2 + 2)
        doc.text(`${angleValue}°`, 82 + barWidth + 2, barY + barHeight / 2 + 2)
      })

      yPos += chartHeight + 20

      if (yPos > 250) {
        doc.addPage()
        yPos = 30
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("OBSERVAÇÕES CLÍNICAS", 20, yPos)
      yPos += 15

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      results.observations.forEach((observation, index) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 30
        }
        const lines = doc.splitTextToSize(`${index + 1}. ${observation}`, 170)
        doc.text(lines, 20, yPos)
        yPos += lines.length * 5 + 5
      })

      yPos += 10

      if (yPos > 200) {
        doc.addPage()
        yPos = 30
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("DESVIOS POSTURAIS POR SEVERIDADE", 20, yPos)
      yPos += 15

      const severityCounts = results.detailedAnalysis.posturalDeviations.reduce(
        (acc, dev) => {
          acc[dev.severity] = (acc[dev.severity] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const totalDeviations = Object.values(severityCounts).reduce((a, b) => a + b, 0)
      let currentX = 20
      const pieWidth = 160
      const pieHeight = 20

      Object.entries(severityCounts).forEach(([severity, count]) => {
        const segmentWidth = (count / totalDeviations) * pieWidth

        if (severity === "leve")
          doc.setFillColor(34, 197, 94) // green
        else if (severity === "moderada")
          doc.setFillColor(251, 191, 36) // yellow
        else doc.setFillColor(239, 68, 68) // red

        doc.rect(currentX, yPos, segmentWidth, pieHeight, "F")

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(8)
        doc.text(`${severity}: ${count}`, currentX, yPos + pieHeight + 8)

        currentX += segmentWidth
      })

      yPos += 40

      if (yPos > 200) {
        doc.addPage()
        yPos = 30
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("RECOMENDAÇÕES DE TRATAMENTO", 20, yPos)
      yPos += 15

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Fortalecimento:", 20, yPos)
      yPos += 10

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      results.recommendations.strengthening.forEach((rec, index) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 30
        }
        const lines = doc.splitTextToSize(`• ${rec}`, 170)
        doc.text(lines, 25, yPos)
        yPos += lines.length * 4 + 3
      })

      yPos += 5

      if (yPos > 250) {
        doc.addPage()
        yPos = 30
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Mobilidade:", 20, yPos)
      yPos += 10

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      results.recommendations.mobility.forEach((rec, index) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 30
        }
        const lines = doc.splitTextToSize(`• ${rec}`, 170)
        doc.text(lines, 25, yPos)
        yPos += lines.length * 4 + 3
      })

      if (yPos > 200) {
        doc.addPage()
        yPos = 30
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("TESTES FISIOTERAPÊUTICOS SUGERIDOS", 20, yPos)
      yPos += 15

      results.physiotherapyTests.forEach((test, index) => {
        if (yPos > 240) {
          doc.addPage()
          yPos = 30
        }

        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.text(`${index + 1}. ${test.testName}`, 20, yPos)
        yPos += 8

        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        const indicationLines = doc.splitTextToSize(`Indicação: ${test.indication}`, 170)
        doc.text(indicationLines, 25, yPos)
        yPos += indicationLines.length * 4 + 3

        const findingsLines = doc.splitTextToSize(`Achados: ${test.expectedFindings}`, 170)
        doc.text(findingsLines, 25, yPos)
        yPos += findingsLines.length * 4 + 8
      })

      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`Página ${i} de ${pageCount}`, 20, 285)
        doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 120, 285)
      }

      doc.save(`relatorio-fisioterapia-${patientFile.name}-${Date.now()}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Erro ao gerar PDF. Tente novamente.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-serif">Relatório de Análise Postural</CardTitle>
                <CardDescription>Análise computacional baseada em IA</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportReport} disabled={isGeneratingReport}>
                {isGeneratingReport ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Print className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Data:</span>
              <span className="font-medium">{currentDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Arquivo:</span>
              <span className="font-medium">{patientFile.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Confiança:</span>
              <span className={`font-medium ${getConfidenceColor(results.confidence)}`}>
                {(results.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Análise Detalhada de Ângulos Articulares</CardTitle>
          <CardDescription>Medições precisas baseadas em landmarks corporais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(results.angles).map(([angleName, angleValue]) => {
              let normalRange: [number, number] = [0, 180]
              const displayName = angleName

              if (angleName.includes("Joelho")) normalRange = [160, 180]
              else if (angleName.includes("Quadril")) normalRange = [170, 185]
              else if (angleName.includes("Ombro")) normalRange = [165, 180]
              else if (angleName.includes("Tornozelo")) normalRange = [85, 95]
              else if (angleName.includes("Cervical")) normalRange = [15, 35]
              else if (angleName.includes("Lombar")) normalRange = [20, 30]

              return (
                <div key={angleName} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{displayName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{angleValue}°</span>
                    <Badge variant={getAngleStatus(angleValue, normalRange).color as any}>
                      {getAngleStatus(angleValue, normalRange).status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Eye className="w-5 h-5 text-blue-600" />
              Observações Clínicas
            </CardTitle>
            <CardDescription>Achados posturais identificados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.observations.map((observation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{observation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Limitações Funcionais
            </CardTitle>
            <CardDescription>Restrições identificadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.limitations.map((limitation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{limitation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Análise Postural Detalhada</CardTitle>
          <CardDescription>Avaliação segmentar e identificação de padrões compensatórios</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deviations" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="deviations">Desvios</TabsTrigger>
              <TabsTrigger value="asymmetries">Assimetrias</TabsTrigger>
              <TabsTrigger value="movements">Movimentos</TabsTrigger>
              <TabsTrigger value="risks">Fatores de Risco</TabsTrigger>
            </TabsList>

            <TabsContent value="deviations" className="space-y-4">
              <div className="grid gap-4">
                {results.detailedAnalysis.posturalDeviations.map((deviation, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{deviation.segment}</h4>
                      <Badge variant={getSeverityColor(deviation.severity) as any}>{deviation.severity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Desvio:</strong> {deviation.deviation}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Compensação:</strong> {deviation.compensation}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="asymmetries" className="space-y-4">
              <div className="grid gap-4">
                {results.detailedAnalysis.asymmetries.map((asymmetry, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <h4 className="font-medium">{asymmetry.region}</h4>
                    <p className="text-sm">{asymmetry.description}</p>
                    <p className="text-sm text-muted-foreground font-mono">{asymmetry.measurement}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="movements" className="space-y-4">
              <div className="grid gap-4">
                {results.detailedAnalysis.functionalMovements.map((movement, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{movement.movement}</h4>
                      <Badge variant={getQualityColor(movement.quality) as any}>{movement.quality}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{movement.observations}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="risks" className="space-y-4">
              <div className="grid gap-3">
                {results.detailedAnalysis.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{risk}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <Target className="w-5 h-5 text-purple-600" />
            Hipóteses Clínicas
          </CardTitle>
          <CardDescription>Possíveis diagnósticos baseados na análise postural</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {results.detailedAnalysis.clinicalHypotheses.map((hypothesis, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <Target className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">{hypothesis}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <Activity className="w-5 h-5 text-green-600" />
            Testes Fisioterapêuticos Sugeridos
          </CardTitle>
          <CardDescription>Avaliações específicas para confirmar hipóteses diagnósticas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.physiotherapyTests.map((test, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800 dark:text-green-400">{test.testName}</h4>
                </div>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Indicação:</p>
                    <p>{test.indication}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Achados Esperados:</p>
                    <p>{test.expectedFindings}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Relevância Clínica:</p>
                    <p>{test.clinicalRelevance}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <Target className="w-5 h-5 text-primary" />
            Protocolo de Tratamento Sugerido
          </CardTitle>
          <CardDescription>Recomendações baseadas em evidências científicas</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="strengthening" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="strengthening">Fortalecimento</TabsTrigger>
              <TabsTrigger value="mobility">Mobilidade</TabsTrigger>
              <TabsTrigger value="proprioception">Propriocepção</TabsTrigger>
              <TabsTrigger value="functional">Funcional</TabsTrigger>
            </TabsList>

            <TabsContent value="strengthening" className="space-y-3">
              {results.recommendations.strengthening.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">{recommendation}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="mobility" className="space-y-3">
              {results.recommendations.mobility.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">{recommendation}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="proprioception" className="space-y-3">
              {results.recommendations.proprioception.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">{recommendation}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="functional" className="space-y-3">
              {results.recommendations.functional.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">{recommendation}</span>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onBackToAnalysis}>
          Nova Análise
        </Button>
        <Button onClick={handleExportPDF} disabled={isGeneratingPDF}>
          {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
          Exportar PDF
        </Button>
        <Button variant="outline" onClick={handleExportReport} disabled={isGeneratingReport}>
          {isGeneratingReport ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar Texto
        </Button>
      </div>
    </div>
  )
}
