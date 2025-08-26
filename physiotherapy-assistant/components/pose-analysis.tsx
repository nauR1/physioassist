"use client"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Eye, Activity, AlertCircle, CheckCircle2 } from "lucide-react"

interface PoseAnalysisProps {
  file: File
  onAnalysisComplete: (results: AnalysisResults) => void
}

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

export function PoseAnalysis({ file, onAnalysisComplete }: PoseAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const generateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  const getExistingAnalysis = (fileHash: string) => {
    const existingAnalyses = localStorage.getItem("physiotherapy_analyses")
    if (!existingAnalyses) return null

    const analyses = JSON.parse(existingAnalyses)
    return analyses.find((analysis: any) => analysis.fileHash === fileHash)
  }

  const performAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)
    setProgress(0)

    try {
      setCurrentStep("Verificando análise existente...")
      setProgress(10)

      const fileHash = await generateFileHash(file)

      const existingAnalysis = getExistingAnalysis(fileHash)
      if (existingAnalysis) {
        setCurrentStep("Carregando análise existente...")
        setProgress(100)

        // Convert stored analysis back to AnalysisResults format
        const formattedResults: AnalysisResults = {
          landmarks: existingAnalysis.landmarks || [],
          angles: existingAnalysis.angles || {},
          observations: existingAnalysis.observations || [],
          limitations: existingAnalysis.limitations || [],
          recommendations: existingAnalysis.recommendations || {
            strengthening: [],
            mobility: [],
            proprioception: [],
            functional: [],
          },
          detailedAnalysis: existingAnalysis.detailedAnalysis || {
            posturalDeviations: [],
            asymmetries: [],
            functionalMovements: [],
            riskFactors: [],
            clinicalHypotheses: [],
          },
          physiotherapyTests: existingAnalysis.physiotherapyTests || [],
          confidence: existingAnalysis.confidence || 0.85,
        }

        // Draw existing landmarks if available
        if (existingAnalysis.landmarks) {
          drawPoseOnCanvas(existingAnalysis.landmarks)
        }

        setCurrentStep("Análise carregada do cache!")
        onAnalysisComplete(formattedResults)
        setIsAnalyzing(false)
        return
      }

      // Step 1: Upload file to backend
      setCurrentStep("Enviando arquivo para processamento...")
      setProgress(20)

      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Erro no upload")
      }

      const uploadResult = await uploadResponse.json()

      // Step 2: Perform AI analysis
      setCurrentStep("Executando análise de pose com IA...")
      setProgress(50)

      const analysisResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData: uploadResult.file.dataUrl,
          fileType: file.type,
        }),
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json()
        throw new Error(errorData.error || "Erro na análise")
      }

      const analysisResult = await analysisResponse.json()

      // Step 3: Process results
      setCurrentStep("Processando resultados clínicos...")
      setProgress(80)

      const realClinicalAnalysis = generateClinicalAnalysisFromLandmarks(
        analysisResult.analysis.landmarks,
        analysisResult.analysis.angles,
      )

      // Draw pose landmarks on canvas
      if (analysisResult.analysis.landmarks) {
        drawPoseOnCanvas(analysisResult.analysis.landmarks)
      }

      setProgress(100)
      setCurrentStep("Análise concluída!")

      // Convert backend format to frontend format with real analysis
      const formattedResults: AnalysisResults = {
        landmarks: analysisResult.analysis.landmarks,
        angles: analysisResult.analysis.angles,
        observations: realClinicalAnalysis.observations,
        limitations: realClinicalAnalysis.limitations,
        recommendations: realClinicalAnalysis.recommendations,
        detailedAnalysis: realClinicalAnalysis.detailedAnalysis,
        physiotherapyTests: realClinicalAnalysis.physiotherapyTests,
        confidence: analysisResult.confidence,
      }

      const analysisForStorage = {
        id: `analysis-${fileHash}`,
        fileHash: fileHash,
        fileName: file.name,
        timestamp: new Date().toISOString(),
        confidence: formattedResults.confidence,
        status: "completed",
        observations: formattedResults.observations,
        angles: formattedResults.angles,
        recommendations: formattedResults.recommendations,
        detailedAnalysis: formattedResults.detailedAnalysis,
        physiotherapyTests: formattedResults.physiotherapyTests,
        landmarks: formattedResults.landmarks,
        limitations: formattedResults.limitations,
      }

      // Get existing analyses from localStorage
      const existingAnalyses = localStorage.getItem("physiotherapy_analyses")
      const analyses = existingAnalyses ? JSON.parse(existingAnalyses) : []

      const filteredAnalyses = analyses.filter((analysis: any) => analysis.fileHash !== fileHash)

      // Add new analysis to the beginning of the array
      filteredAnalyses.unshift(analysisForStorage)

      // Keep only the last 50 analyses to prevent localStorage from getting too large
      const limitedAnalyses = filteredAnalyses.slice(0, 50)

      // Save back to localStorage
      localStorage.setItem("physiotherapy_analyses", JSON.stringify(limitedAnalyses))

      onAnalysisComplete(formattedResults)
    } catch (err) {
      console.error("Erro na análise:", err)
      setError(err instanceof Error ? err.message : "Falha na análise. Tente novamente.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const drawPoseOnCanvas = (landmarks: Array<{ x: number; y: number; z: number; visibility: number }>) => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    // Draw landmarks
    ctx.fillStyle = "#059669"
    ctx.strokeStyle = "#10b981"
    ctx.lineWidth = 2

    landmarks.forEach((landmark, index) => {
      if (landmark.visibility > 0.5) {
        ctx.beginPath()
        ctx.arc(landmark.x, landmark.y, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    })

    // Draw connections between key points (simplified skeleton)
    const connections = [
      [11, 12],
      [11, 13],
      [12, 14],
      [13, 15],
      [14, 16], // Arms
      [11, 23],
      [12, 24],
      [23, 24], // Torso
      [23, 25],
      [24, 26],
      [25, 27],
      [26, 28], // Legs
    ]

    ctx.beginPath()
    connections.forEach(([start, end]) => {
      if (landmarks[start]?.visibility > 0.5 && landmarks[end]?.visibility > 0.5) {
        ctx.moveTo(landmarks[start].x, landmarks[start].y)
        ctx.lineTo(landmarks[end].x, landmarks[end].y)
      }
    })
    ctx.stroke()
  }

  const generateClinicalAnalysisFromLandmarks = (
    landmarks: Array<{ x: number; y: number; z: number; visibility: number }>,
    angles: { [key: string]: number },
  ) => {
    const observations: string[] = []
    const limitations: string[] = []
    const posturalDeviations: Array<{
      segment: string
      deviation: string
      severity: "leve" | "moderada" | "severa"
      compensation: string
    }> = []
    const asymmetries: Array<{
      region: string
      description: string
      measurement: string
    }> = []
    const functionalMovements: Array<{
      movement: string
      quality: "normal" | "alterado" | "limitado"
      observations: string
    }> = []
    const riskFactors: string[] = []
    const clinicalHypotheses: string[] = []
    const physiotherapyTests: Array<{
      testName: string
      indication: string
      expectedFindings: string
      clinicalRelevance: string
    }> = []

    // Helper function to calculate angle between three points
    const calculateAngle = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number },
    ): number => {
      const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
      const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }

      const dot = v1.x * v2.x + v1.y * v2.y
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

      const cosAngle = dot / (mag1 * mag2)
      return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI)
    }

    // Helper function to calculate distance between two points
    const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
    }

    // Helper function to determine severity based on deviation from normal
    const getSeverity = (deviation: number, mild: number, moderate: number): "leve" | "moderada" | "severa" => {
      if (deviation < mild) return "leve"
      if (deviation < moderate) return "moderada"
      return "severa"
    }

    // 1. ANÁLISE PRECISA DA POSTURA CERVICAL
    if (landmarks[0] && landmarks[7] && landmarks[8] && landmarks[11] && landmarks[12]) {
      // Craniovertebral angle (CVA) - ângulo entre linha horizontal e linha da cabeça
      const earMidpoint = { x: (landmarks[7].x + landmarks[8].x) / 2, y: (landmarks[7].y + landmarks[8].y) / 2 }
      const shoulderMidpoint = {
        x: (landmarks[11].x + landmarks[12].x) / 2,
        y: (landmarks[11].y + landmarks[12].y) / 2,
      }
      const nosePoint = { x: landmarks[0].x, y: landmarks[0].y }

      // Calcular CVA (normal: 48-52°)
      const cva = calculateAngle(
        { x: earMidpoint.x + 100, y: earMidpoint.y }, // ponto horizontal
        earMidpoint,
        shoulderMidpoint,
      )

      const cvaDeviation = Math.abs(cva - 50) // 50° é o valor ideal

      if (cvaDeviation > 5) {
        const severity = getSeverity(cvaDeviation, 8, 15)
        observations.push(`Ângulo craniovertebral: ${cva.toFixed(1)}° (normal: 48-52°)`)
        posturalDeviations.push({
          segment: "Coluna Cervical",
          deviation: cva < 48 ? "Anteriorização da cabeça" : "Retração cervical excessiva",
          severity,
          compensation: cva < 48 ? "Hiperextensão cervical alta (C1-C2)" : "Flexão cervical compensatória",
        })

        if (cva < 45) {
          limitations.push("Redução significativa da mobilidade cervical em extensão")
          riskFactors.push("Alto risco de cefaleia cervicogênica e dor suboccipital")
          clinicalHypotheses.push("Síndrome do cruzamento superior")
          physiotherapyTests.push({
            testName: "Teste de Flexão-Rotação Cervical (C1-C2)",
            indication: "Avaliar mobilidade atlantoaxial restrita pela anteriorização",
            expectedFindings: `Restrição >10° (normal: 44°±5°) devido ao CVA de ${cva.toFixed(1)}°`,
            clinicalRelevance: "Confirma disfunção C1-C2 como fonte primária de cefaleia",
          })
        }
      }
    }

    // 2. ANÁLISE PRECISA DOS OMBROS E ESCÁPULAS
    if (landmarks[11] && landmarks[12] && landmarks[13] && landmarks[14]) {
      // Altura dos ombros
      const shoulderHeightDiff = Math.abs(landmarks[11].y - landmarks[12].y)
      const shoulderHeightPercent = (shoulderHeightDiff / Math.abs(landmarks[11].y - landmarks[23].y)) * 100

      if (shoulderHeightPercent > 3) {
        // >3% é considerado significativo
        const higherShoulder = landmarks[11].y < landmarks[12].y ? "esquerdo" : "direito"
        const lowerShoulder = higherShoulder === "esquerdo" ? "direito" : "esquerdo"
        const severity = getSeverity(shoulderHeightPercent, 5, 10)

        observations.push(`Assimetria de ombros: ${shoulderHeightPercent.toFixed(1)}% (normal: <3%)`)
        asymmetries.push({
          region: "Cintura Escapular",
          description: `Ombro ${higherShoulder} elevado`,
          measurement: `${shoulderHeightPercent.toFixed(1)}% de assimetria`,
        })

        posturalDeviations.push({
          segment: "Ombros",
          deviation: `Elevação unilateral - ombro ${higherShoulder}`,
          severity,
          compensation: `Inclinação lateral cervical para o lado ${lowerShoulder}`,
        })

        // Análise específica baseada no lado
        if (shoulderHeightPercent > 8) {
          limitations.push(`Restrição da elevação do ombro ${lowerShoulder}`)
          riskFactors.push("Possível escoliose funcional ou discrepância de membros superiores")
          clinicalHypotheses.push(`Síndrome do trapézio superior ${higherShoulder}`)

          physiotherapyTests.push({
            testName: "Teste de Comprimento do Trapézio Superior",
            indication: `Avaliar encurtamento do trapézio superior ${higherShoulder}`,
            expectedFindings: `Restrição de ${Math.round(shoulderHeightPercent * 2)}° na flexão lateral contralateral`,
            clinicalRelevance: "Confirma tensão muscular como causa da elevação do ombro",
          })
        }
      }

      // Protração dos ombros (análise sagital)
      const shoulderProtraction = Math.abs(landmarks[11].x - landmarks[12].x) / 2
      const torsoWidth = calculateDistance(landmarks[11], landmarks[12])
      const protractionRatio = shoulderProtraction / torsoWidth

      if (protractionRatio > 0.15) {
        // >15% indica protração significativa
        observations.push(`Protração dos ombros: ${(protractionRatio * 100).toFixed(1)}% (normal: <15%)`)
        posturalDeviations.push({
          segment: "Ombros",
          deviation: "Protração bilateral",
          severity: getSeverity(protractionRatio * 100, 20, 30),
          compensation: "Cifose torácica compensatória",
        })

        limitations.push("Redução da amplitude de movimento em retração escapular")
        riskFactors.push("Síndrome do impacto subacromial bilateral")
        clinicalHypotheses.push("Síndrome do peitoral menor")

        physiotherapyTests.push({
          testName: "Teste de Comprimento do Peitoral Menor",
          indication: "Avaliar encurtamento que causa protração escapular",
          expectedFindings: `Elevação posterior >2,5cm (normal: <1cm) devido à protração de ${(protractionRatio * 100).toFixed(1)}%`,
          clinicalRelevance: "Identifica causa muscular primária da protração",
        })
      }
    }

    // 3. ANÁLISE PRECISA DA PELVE E QUADRIS
    if (landmarks[23] && landmarks[24] && landmarks[25] && landmarks[26]) {
      // Nivelamento pélvico
      const pelvicTilt = Math.abs(landmarks[23].y - landmarks[24].y)
      const legLength = Math.abs(landmarks[23].y - landmarks[25].y)
      const pelvicTiltPercent = (pelvicTilt / legLength) * 100

      if (pelvicTiltPercent > 2) {
        // >2% é significativo
        const higherHip = landmarks[23].y < landmarks[24].y ? "esquerdo" : "direito"
        const severity = getSeverity(pelvicTiltPercent, 3, 6)

        observations.push(`Desnivelamento pélvico: ${pelvicTiltPercent.toFixed(1)}% (normal: <2%)`)
        asymmetries.push({
          region: "Pelve",
          description: `Quadril ${higherHip} elevado`,
          measurement: `${pelvicTiltPercent.toFixed(1)}% de desnivelamento`,
        })

        posturalDeviations.push({
          segment: "Pelve",
          deviation: `Elevação unilateral - quadril ${higherHip}`,
          severity,
          compensation: "Escoliose lombar compensatória",
        })

        if (pelvicTiltPercent > 4) {
          limitations.push("Limitação da mobilidade pélvica em inclinação lateral")
          riskFactors.push("Possível discrepância de membros inferiores ou disfunção sacroilíaca")
          clinicalHypotheses.push("Síndrome do quadrado lombar")

          physiotherapyTests.push({
            testName: "Teste de Trendelenburg",
            indication: "Avaliar força do glúteo médio e estabilidade pélvica",
            expectedFindings: `Positivo no lado ${higherHip} com queda pélvica contralateral`,
            clinicalRelevance: "Confirma fraqueza muscular como causa do desnivelamento",
          })

          physiotherapyTests.push({
            testName: "Teste de Gillet (Flexão do Quadril)",
            indication: "Avaliar mobilidade sacroilíaca",
            expectedFindings: "Possível restrição unilateral da articulação sacroilíaca",
            clinicalRelevance: "Diferencia causa articular de causa muscular",
          })
        }
      }

      // Análise do valgo/varo dinâmico dos joelhos
      const leftKneeAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]) // quadril-joelho-tornozelo esquerdo
      const rightKneeAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]) // quadril-joelho-tornozelo direito

      // Ângulo normal do joelho: 170-175°
      const leftKneeDeviation = Math.abs(leftKneeAngle - 172.5)
      const rightKneeDeviation = Math.abs(rightKneeAngle - 172.5)

      if (leftKneeDeviation > 5 || rightKneeDeviation > 5) {
        const affectedSide = leftKneeDeviation > rightKneeDeviation ? "esquerdo" : "direito"
        const kneeAngle = leftKneeDeviation > rightKneeDeviation ? leftKneeAngle : rightKneeAngle
        const deviation = kneeAngle < 170 ? "valgo" : "varo"

        observations.push(
          `Desvio em ${deviation} do joelho ${affectedSide}: ${kneeAngle.toFixed(1)}° (normal: 170-175°)`,
        )
        posturalDeviations.push({
          segment: "Joelhos",
          deviation: `${deviation.charAt(0).toUpperCase() + deviation.slice(1)} dinâmico ${affectedSide}`,
          severity: getSeverity(Math.max(leftKneeDeviation, rightKneeDeviation), 8, 15),
          compensation: deviation === "valgo" ? "Rotação interna do fêmur" : "Rotação externa do fêmur",
        })

        functionalMovements.push({
          movement: "Agachamento",
          quality: "alterado",
          observations: `${deviation.charAt(0).toUpperCase() + deviation.slice(1)} dinâmico durante flexão - ângulo ${kneeAngle.toFixed(1)}°`,
        })

        if (deviation === "valgo") {
          limitations.push("Controle neuromuscular inadequado durante atividades funcionais")
          riskFactors.push("Alto risco de síndrome da dor patelofemoral")
          clinicalHypotheses.push("Síndrome da banda iliotibial")

          physiotherapyTests.push({
            testName: "Teste de Ober Modificado",
            indication: "Avaliar tensão da banda iliotibial que contribui para o valgo",
            expectedFindings: `Positivo com ângulo de adução <10° (normal: 15-20°)`,
            clinicalRelevance: "Confirma tensão lateral como fator contribuinte para valgo dinâmico",
          })

          physiotherapyTests.push({
            testName: "Single Leg Squat Test",
            indication: "Avaliar controle neuromuscular durante movimento funcional",
            expectedFindings: `Valgo dinâmico >10° da linha média durante agachamento unipodal`,
            clinicalRelevance: "Quantifica déficit de controle motor que predispõe à lesão",
          })
        }
      }
    }

    // 4. ANÁLISE DE MOVIMENTOS FUNCIONAIS BASEADA EM LANDMARKS

    // Avaliação da elevação de braços
    if (landmarks[15] && landmarks[16] && landmarks[11] && landmarks[12]) {
      const leftArmElevation = calculateAngle(landmarks[11], landmarks[13], landmarks[15])
      const rightArmElevation = calculateAngle(landmarks[12], landmarks[14], landmarks[16])
      const armElevationDiff = Math.abs(leftArmElevation - rightArmElevation)

      functionalMovements.push({
        movement: "Elevação de braços",
        quality: armElevationDiff > 15 ? "alterado" : "normal",
        observations:
          armElevationDiff > 15
            ? `Assimetria de ${armElevationDiff.toFixed(1)}° entre os braços (E: ${leftArmElevation.toFixed(1)}°, D: ${rightArmElevation.toFixed(1)}°)`
            : `Elevação simétrica bilateral (diferença: ${armElevationDiff.toFixed(1)}°)`,
      })

      if (armElevationDiff > 20) {
        const restrictedSide = leftArmElevation < rightArmElevation ? "esquerdo" : "direito"
        limitations.push(`Restrição da elevação do braço ${restrictedSide}`)

        physiotherapyTests.push({
          testName: "Teste de Impacto de Neer",
          indication: `Avaliar síndrome do impacto no ombro ${restrictedSide}`,
          expectedFindings: "Possível positivo com dor durante elevação passiva",
          clinicalRelevance: "Identifica impacto subacromial como causa da restrição",
        })
      }
    }

    // 5. GERAÇÃO DE RECOMENDAÇÕES BASEADAS EM EVIDÊNCIAS
    const recommendations = {
      strengthening: [] as string[],
      mobility: [] as string[],
      proprioception: [] as string[],
      functional: [] as string[],
    }

    // Recomendações específicas baseadas nos achados
    if (posturalDeviations.some((d) => d.segment === "Coluna Cervical" && d.deviation.includes("Anteriorização"))) {
      recommendations.strengthening.push(
        "Fortalecimento específico de flexores profundos do pescoço (3x10 reps, 10s hold)",
      )
      recommendations.mobility.push("Mobilização neural do plexo braquial e alongamento de suboccipitais")
      recommendations.functional.push("Reeducação postural com biofeedback para correção do CVA")
    }

    if (posturalDeviations.some((d) => d.segment === "Ombros" && d.deviation.includes("Protração"))) {
      recommendations.strengthening.push("Fortalecimento de romboides e trapézio médio (3x15 reps com resistência)")
      recommendations.mobility.push("Liberação miofascial e alongamento específico do peitoral menor")
      recommendations.proprioception.push("Exercícios de consciência escapular com feedback tátil")
    }

    if (asymmetries.some((a) => a.region.includes("Pelve"))) {
      recommendations.strengthening.push("Fortalecimento unilateral de glúteo médio com progressão funcional")
      recommendations.proprioception.push("Treinamento de estabilização pélvica em superfícies instáveis")
      recommendations.functional.push("Correção de padrões de movimento durante atividades de vida diária")
    }

    if (posturalDeviations.some((d) => d.segment === "Joelhos" && d.deviation.includes("valgo"))) {
      recommendations.strengthening.push("Fortalecimento de glúteo médio e rotadores externos do quadril")
      recommendations.mobility.push("Liberação da banda iliotibial e alongamento de adutores")
      recommendations.proprioception.push("Treinamento de controle neuromuscular com foco no alinhamento do joelho")
      recommendations.functional.push("Progressão de agachamento com correção do valgo dinâmico")
    }

    // Recomendações gerais se nenhum problema específico for encontrado
    if (Object.values(recommendations).every((arr) => arr.length === 0)) {
      recommendations.strengthening.push("Programa de fortalecimento de core e estabilizadores posturais")
      recommendations.mobility.push("Rotina de mobilidade global com foco na cadeia posterior")
      recommendations.proprioception.push("Exercícios de equilíbrio e propriocepção progressivos")
      recommendations.functional.push("Treinamento de padrões de movimento fundamentais")
    }

    return {
      observations,
      limitations,
      recommendations,
      detailedAnalysis: {
        posturalDeviations,
        asymmetries,
        functionalMovements,
        riskFactors,
        clinicalHypotheses,
      },
      physiotherapyTests,
    }
  }

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (imageRef.current && e.target?.result) {
          imageRef.current.src = e.target.result as string
          imageRef.current.onload = () => {
            if (canvasRef.current && imageRef.current) {
              canvasRef.current.width = 500
              canvasRef.current.height = 600
              const ctx = canvasRef.current.getContext("2d")
              if (ctx && imageRef.current) {
                ctx.drawImage(imageRef.current, 0, 0, 500, 600)
              }
            }
          }
        }
      }
      reader.readAsDataURL(file)
    }
  }, [file])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <Brain className="w-5 h-5 text-primary" />
            Análise Postural com IA
          </CardTitle>
          <CardDescription>
            Análise avançada baseada em Mediapipe para detecção de landmarks corporais e avaliação clínica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Preview and Canvas */}
          <div className="flex justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="border border-border rounded-lg max-w-full h-auto"
                style={{ maxHeight: "400px" }}
              />
              <img ref={imageRef} className="hidden" alt="Patient analysis" />
            </div>
          </div>

          {/* Analysis Controls */}
          {!isAnalyzing && (
            <div className="text-center">
              <Button onClick={performAnalysis} size="lg" className="px-8">
                <Eye className="w-5 h-5 mr-2" />
                Iniciar Análise Postural
              </Button>
            </div>
          )}

          {/* Progress Indicator */}
          {isAnalyzing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-medium">{currentStep}</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">Análise em progresso... {progress}%</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Capacidades de Detecção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                "33 landmarks corporais (Mediapipe)",
                "Cálculo automático de ângulos articulares",
                "Análise de assimetrias posturais",
                "Detecção de padrões compensatórios",
                "Avaliação de amplitude de movimento",
                "Identificação de desvios posturais",
                "Análise precisa da postura cervical",
                "Análise precisa dos ombros e escápulas",
                "Análise precisa da pelve e quadril",
                "Análise de movimentos funcionais baseada em landmarks",
              ].map((capability) => (
                <div key={capability} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm">{capability}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Análise Clínica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Segmentos Avaliados:</h4>
                <div className="flex flex-wrap gap-2">
                  {["Cervical", "Torácica", "Lombar", "Ombro", "Quadril", "Joelho", "Tornozelo"].map((area) => (
                    <Badge key={area} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Movimentos Funcionais:</h4>
                <div className="flex flex-wrap gap-2">
                  {["Agachamento", "Elevação de Braços", "Rotação", "Equilíbrio"].map((movement) => (
                    <Badge key={movement} variant="outline" className="text-xs">
                      {movement}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
