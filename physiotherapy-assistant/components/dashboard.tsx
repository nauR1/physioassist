"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, TrendingUp, Clock, BarChart3, PieChart, Brain, CheckCircle2, Upload, RefreshCw } from "lucide-react"

interface DashboardProps {
  onNavigateToUpload: () => void
}

interface AnalysisData {
  id: string
  fileName: string
  timestamp: string
  confidence: number
  status: string
  observations: string[]
  jointAngles: Record<string, number>
  recommendations: string[]
}

export function Dashboard({ onNavigateToUpload }: DashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [analyses, setAnalyses] = useState<AnalysisData[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    thisWeek: 0,
    avgConfidence: 0,
    avgProcessingTime: 0,
    commonFindings: [] as { name: string; count: number }[],
    commonRecommendations: [] as { name: string; count: number }[],
  })

  useEffect(() => {
    loadRealData()
  }, [])

  const loadRealData = () => {
    setLoading(true)
    try {
      // Get analyses from localStorage
      const storedAnalyses = localStorage.getItem("physiotherapy_analyses")
      const analysesData: AnalysisData[] = storedAnalyses ? JSON.parse(storedAnalyses) : []

      const convertedAnalyses = analysesData.map((analysis: any) => ({
        id: analysis.id || `analysis-${Date.now()}-${Math.random()}`,
        fileName: analysis.fileName || "Análise sem nome",
        timestamp: analysis.timestamp || new Date().toISOString(),
        confidence: analysis.confidence || 0.85,
        status: "completed",
        observations: analysis.observations || [],
        jointAngles: analysis.angles || {},
        recommendations: analysis.recommendations
          ? [
              ...(analysis.recommendations.strengthening || []),
              ...(analysis.recommendations.mobility || []),
              ...(analysis.recommendations.proprioception || []),
              ...(analysis.recommendations.functional || []),
            ]
          : [],
      }))

      setAnalyses(convertedAnalyses)

      // Calculate real statistics
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const thisWeekAnalyses = convertedAnalyses.filter((analysis) => new Date(analysis.timestamp) >= oneWeekAgo)

      const totalConfidence = convertedAnalyses.reduce((sum, analysis) => sum + analysis.confidence, 0)
      const avgConfidence = convertedAnalyses.length > 0 ? totalConfidence / convertedAnalyses.length : 0

      // Count common findings
      const findingsCount: Record<string, number> = {}
      const recommendationsCount: Record<string, number> = {}

      convertedAnalyses.forEach((analysis) => {
        analysis.observations.forEach((obs) => {
          findingsCount[obs] = (findingsCount[obs] || 0) + 1
        })
        if (Array.isArray(analysis.recommendations)) {
          analysis.recommendations.forEach((rec) => {
            recommendationsCount[rec] = (recommendationsCount[rec] || 0) + 1
          })
        }
      })

      const commonFindings = Object.entries(findingsCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([name, count]) => ({ name, count }))

      const commonRecommendations = Object.entries(recommendationsCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, count]) => ({ name, count }))

      setStats({
        totalAnalyses: convertedAnalyses.length,
        thisWeek: thisWeekAnalyses.length,
        avgConfidence,
        avgProcessingTime: 2.3, // Simulated average processing time
        commonFindings,
        commonRecommendations,
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return "default"
    if (confidence >= 0.6) return "secondary"
    return "destructive"
  }

  const getConfidenceDistribution = () => {
    if (analyses.length === 0) return { high: 0, medium: 0, low: 0 }

    const high = analyses.filter((a) => a.confidence >= 0.8).length
    const medium = analyses.filter((a) => a.confidence >= 0.6 && a.confidence < 0.8).length
    const low = analyses.filter((a) => a.confidence < 0.6).length

    return {
      high: Math.round((high / analyses.length) * 100),
      medium: Math.round((medium / analyses.length) * 100),
      low: Math.round((low / analyses.length) * 100),
    }
  }

  const confidenceDistribution = getConfidenceDistribution()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-black text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            {analyses.length > 0
              ? `Visão geral de ${analyses.length} análises posturais realizadas`
              : "Nenhuma análise realizada ainda"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRealData} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={onNavigateToUpload} size="lg">
            <Upload className="w-5 h-5 mr-2" />
            Nova Análise
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Análises</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">+{stats.thisWeek} esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAnalyses > 0 ? (stats.avgConfidence * 100).toFixed(1) : "0.0"}%
            </div>
            <Progress value={stats.avgConfidence * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisWeek > 0 ? "Análises realizadas" : "Nenhuma análise"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}s</div>
            <p className="text-xs text-muted-foreground">Por análise</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Análises Recentes</TabsTrigger>
          <TabsTrigger value="analytics">Estatísticas</TabsTrigger>
          <TabsTrigger value="patterns">Padrões Comuns</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Análises Recentes</CardTitle>
              <CardDescription>
                {analyses.length > 0
                  ? `${analyses.length} análises posturais realizadas`
                  : "Nenhuma análise realizada ainda"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma análise encontrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Faça sua primeira análise postural para ver os dados aqui
                  </p>
                  <Button onClick={onNavigateToUpload} className="mt-4">
                    Começar Análise
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.slice(0, 4).map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{analysis.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(analysis.timestamp).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{analysis.observations.length} achados</p>
                          <p className={`text-sm ${getConfidenceColor(analysis.confidence)}`}>
                            {(analysis.confidence * 100).toFixed(1)}% confiança
                          </p>
                        </div>
                        <Badge variant={getConfidenceBadge(analysis.confidence) as any}>
                          {analysis.status === "completed" ? "Concluída" : "Processando"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <BarChart3 className="w-5 h-5" />
                  Análises por Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Dados insuficientes para exibir gráfico</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Esta semana</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${Math.min((stats.thisWeek / Math.max(stats.totalAnalyses, 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">{stats.thisWeek}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: "100%" }} />
                        </div>
                        <span className="text-sm font-medium">{stats.totalAnalyses}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <PieChart className="w-5 h-5" />
                  Distribuição de Confiança
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Dados insuficientes para exibir distribuição</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-sm">Alta (≥80%)</span>
                      </div>
                      <span className="text-sm font-medium">{confidenceDistribution.high}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <span className="text-sm">Média (60-79%)</span>
                      </div>
                      <span className="text-sm font-medium">{confidenceDistribution.medium}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-sm">Baixa (&lt;60%)</span>
                      </div>
                      <span className="text-sm font-medium">{confidenceDistribution.low}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Achados Mais Comuns</CardTitle>
              <CardDescription>
                {stats.commonFindings.length > 0
                  ? "Padrões posturais identificados com maior frequência"
                  : "Nenhum padrão identificado ainda"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.commonFindings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Realize mais análises para identificar padrões comuns
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.commonFindings.map((finding, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{finding.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-background rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${Math.max((finding.count / Math.max(stats.totalAnalyses, 1)) * 100, 5)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{finding.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Recomendações Frequentes</CardTitle>
              <CardDescription>
                {stats.commonRecommendations.length > 0
                  ? "Intervenções mais sugeridas pelo sistema"
                  : "Nenhuma recomendação registrada ainda"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.commonRecommendations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Realize análises para ver recomendações frequentes
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {stats.commonRecommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm">{recommendation.name}</span>
                        <div className="text-xs text-muted-foreground">
                          {recommendation.count} vez{recommendation.count !== 1 ? "es" : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
