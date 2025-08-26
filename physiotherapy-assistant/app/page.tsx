"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  FileImage,
  FileVideo,
  Activity,
  Brain,
  FileText,
  BarChart3,
  AlertCircle,
  History,
  Camera,
  Dumbbell,
} from "lucide-react"
import { PoseAnalysis } from "@/components/pose-analysis"
import { ClinicalReport } from "@/components/clinical-report"
import { Dashboard } from "@/components/dashboard"
import { PatientHistory } from "@/components/patient-history"
import { WebcamCapture } from "@/components/webcam-capture"
import { RealtimePoseAnalysis } from "@/components/realtime-pose-analysis"
import { ExerciseTemplates } from "@/components/exercise-templates"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AnalysisResults {
  landmarks: Array<{ x: number; y: number; visibility: number }>
  angles: {
    leftKnee: number
    rightKnee: number
    leftHip: number
    rightHip: number
    leftShoulder: number
    rightShoulder: number
    spinalAlignment: number
  }
  observations: string[]
  limitations: string[]
  recommendations: string[]
  confidence: number
}

type ViewMode =
  | "dashboard"
  | "upload"
  | "analysis"
  | "report"
  | "history"
  | "webcam"
  | "exercises"
  | "settings"
  | "realtime"

export default function PhysioAssistant() {
  const [currentView, setCurrentView] = useState<ViewMode>("dashboard")
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [currentAnalysisFile, setCurrentAnalysisFile] = useState<File | null>(null)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      const supportedFiles = files.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
      setUploadedFiles((prev) => [...prev, ...supportedFiles])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setUploadedFiles((prev) => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const startAnalysis = (file: File) => {
    setCurrentAnalysisFile(file)
    setAnalysisResults(null)
    setCurrentView("analysis")
  }

  const handleAnalysisComplete = (results: AnalysisResults) => {
    setAnalysisResults(results)
    setCurrentView("report")
  }

  const navigateToUpload = () => {
    setCurrentView("upload")
    setCurrentAnalysisFile(null)
    setAnalysisResults(null)
  }

  const navigateToDashboard = () => {
    setCurrentView("dashboard")
    setCurrentAnalysisFile(null)
    setAnalysisResults(null)
  }

  const backToAnalysis = () => {
    setAnalysisResults(null)
    setCurrentView("analysis")
  }

  const clearAllFiles = () => {
    setUploadedFiles([])
  }

  const handleViewAnalysis = (analysisId: string) => {
    // Load specific analysis and show report
    const analyses = JSON.parse(localStorage.getItem("physiotherapy_analyses") || "[]")
    const analysis = analyses.find((a: any) => a.id === analysisId)
    if (analysis) {
      setAnalysisResults(analysis)
      setCurrentView("report")
    }
  }

  const handleCompareAnalyses = (ids: string[]) => {
    // Implementation for comparison view
    console.log("Comparing analyses:", ids)
    // This would open a comparison view
  }

  const handleExportExercises = (exercises: any[]) => {
    // Export exercises as PDF or text
    const exerciseText = exercises
      .map(
        (ex) =>
          `${ex.name}\n${ex.description}\nDuração: ${ex.duration}\nRepetições: ${ex.repetitions}\nFrequência: ${ex.frequency}\n\n`,
      )
      .join("")

    const blob = new Blob([exerciseText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `protocolo-exercicios-${Date.now()}.txt`
    a.click()
  }

  const renderHeader = () => (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
              <Activity className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">PhysioAssist</h1>
              <p className="text-sm text-muted-foreground font-medium">AI-Powered Postural Analysis</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant={currentView === "dashboard" ? "default" : "outline"}
              onClick={navigateToDashboard}
              className="shadow-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={currentView === "upload" ? "default" : "outline"}
              onClick={navigateToUpload}
              className="shadow-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button
              variant={currentView === "webcam" ? "default" : "outline"}
              onClick={() => setCurrentView("webcam")}
              className="shadow-sm"
            >
              <Camera className="w-4 h-4 mr-2" />
              Webcam
            </Button>
            <Button
              variant={currentView === "realtime" ? "default" : "outline"}
              onClick={() => setCurrentView("realtime")}
              className="shadow-sm"
            >
              <Activity className="w-4 h-4 mr-2" />
              Tempo Real
            </Button>
            <Button
              variant={currentView === "history" ? "default" : "outline"}
              onClick={() => setCurrentView("history")}
              className="shadow-sm"
            >
              <History className="w-4 h-4 mr-2" />
              Histórico
            </Button>
            {analysisResults && (
              <Button
                variant={currentView === "exercises" ? "default" : "outline"}
                onClick={() => setCurrentView("exercises")}
                className="shadow-sm"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Exercícios
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )

  if (currentView === "report" && analysisResults && currentAnalysisFile) {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <ClinicalReport
              results={analysisResults}
              patientFile={currentAnalysisFile}
              onBackToAnalysis={backToAnalysis}
            />
          </div>
        </main>
      </div>
    )
  }

  if (currentView === "analysis" && currentAnalysisFile) {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <PoseAnalysis file={currentAnalysisFile} onAnalysisComplete={handleAnalysisComplete} />
          </div>
        </main>
      </div>
    )
  }

  if (currentView === "dashboard") {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <Dashboard onNavigateToUpload={navigateToUpload} />
          </div>
        </main>
      </div>
    )
  }

  if (currentView === "history") {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <PatientHistory onViewAnalysis={handleViewAnalysis} onCompareAnalyses={handleCompareAnalyses} />
          </div>
        </main>
      </div>
    )
  }

  if (currentView === "webcam") {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <WebcamCapture
              onCapture={(file) => {
                setUploadedFiles((prev) => [...prev, file])
                setCurrentView("upload")
              }}
            />
          </div>
        </main>
      </div>
    )
  }

  if (currentView === "exercises" && analysisResults) {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <ExerciseTemplates analysisResults={analysisResults} onExportExercises={handleExportExercises} />
          </div>
        </main>
      </div>
    )
  }

  if (currentView === "realtime") {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <RealtimePoseAnalysis />
          </div>
        </main>
      </div>
    )
  }

  // Upload view (default)
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {renderHeader()}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Welcome Section */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
                Professional Physiotherapy Analysis
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Upload patient images or videos to receive instant AI-powered postural analysis, functional assessments,
                and evidence-based treatment recommendations.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered Analysis
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Activity className="w-4 h-4 mr-2" />
                Real-time Processing
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <FileText className="w-4 h-4 mr-2" />
                Clinical Reports
              </Badge>
            </div>
          </div>

          {/* Alert */}
          <Alert className="border-primary/20 bg-primary/5">
            <Brain className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Sistema totalmente funcional com backend integrado, análise de IA em tempo real e persistência de dados no
              dashboard.
            </AlertDescription>
          </Alert>

          {/* Upload Section */}
          <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 font-serif text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                Upload Patient Media
              </CardTitle>
              <CardDescription className="text-lg">
                Drag and drop images or videos, or click to browse files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center shadow-lg">
                      <Upload className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-foreground">Drop files here or click to upload</p>
                    <p className="text-muted-foreground">Supports JPG, PNG, MP4, MOV files up to 50MB</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Uploaded Files ({uploadedFiles.length}):</h4>
                    <Button variant="outline" size="sm" onClick={clearAllFiles}>
                      Clear All
                    </Button>
                  </div>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith("image/") ? (
                          <FileImage className="w-5 h-5 text-primary" />
                        ) : (
                          <FileVideo className="w-5 h-5 text-primary" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => startAnalysis(file)}
                          disabled={!file.type.startsWith("image/")}
                        >
                          <Brain className="w-4 h-4 mr-1" />
                          Analyze
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => removeFile(index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  {uploadedFiles.some((file) => file.type.startsWith("video/")) && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Análise de vídeo em desenvolvimento. Atualmente suportamos apenas imagens estáticas.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 font-serif text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  Postural Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Advanced computer vision identifies body landmarks and calculates joint angles for comprehensive
                  postural assessment.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 font-serif text-xl">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Brain className="w-6 h-6 text-secondary" />
                  </div>
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Machine learning algorithms provide detailed observations on deviations, asymmetries, and functional
                  limitations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 font-serif text-xl">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <FileText className="w-6 h-6 text-accent" />
                  </div>
                  Clinical Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Instant generation of professional reports with treatment recommendations and intervention strategies.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Clinical Focus Areas */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-card via-card to-muted/30">
            <CardHeader className="pb-6">
              <CardTitle className="font-serif text-2xl">Clinical Assessment Areas</CardTitle>
              <CardDescription className="text-lg">
                Our AI analyzes multiple aspects of patient movement and posture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {[
                  "Range of Motion (ROM)",
                  "Postural Deviations",
                  "Joint Stability",
                  "Muscle Imbalances",
                  "Gait Analysis",
                  "Spinal Alignment",
                  "Functional Movement",
                  "Compensatory Patterns",
                ].map((area) => (
                  <Badge key={area} variant="secondary" className="px-4 py-2 text-sm font-medium shadow-sm">
                    {area}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
