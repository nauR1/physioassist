"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, User, Trash2, Eye, Compass as Compare } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PatientRecord {
  id: string
  name: string
  date: string
  fileName: string
  confidence: number
  mainIssues: string[]
  analysisId: string
}

interface PatientHistoryProps {
  onViewAnalysis: (analysisId: string) => void
  onCompareAnalyses: (ids: string[]) => void
}

export function PatientHistory({ onViewAnalysis, onCompareAnalyses }: PatientHistoryProps) {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([])

  useEffect(() => {
    loadPatientHistory()
  }, [])

  const loadPatientHistory = () => {
    const analyses = JSON.parse(localStorage.getItem("physiotherapy_analyses") || "[]")
    const patientRecords: PatientRecord[] = analyses.map((analysis: any) => ({
      id: analysis.id,
      name: analysis.patientName || "Paciente Anônimo",
      date: analysis.timestamp,
      fileName: analysis.fileName,
      confidence: analysis.confidence,
      mainIssues: analysis.observations?.slice(0, 3) || [],
      analysisId: analysis.id,
    }))
    setPatients(patientRecords.reverse()) // Most recent first
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.fileName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleComparison = (id: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id)
      } else if (prev.length < 2) {
        return [...prev, id]
      }
      return prev
    })
  }

  const deleteRecord = (id: string) => {
    const analyses = JSON.parse(localStorage.getItem("physiotherapy_analyses") || "[]")
    const updatedAnalyses = analyses.filter((analysis: any) => analysis.id !== id)
    localStorage.setItem("physiotherapy_analyses", JSON.stringify(updatedAnalyses))
    loadPatientHistory()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold">Histórico de Pacientes</h2>
        {selectedForComparison.length === 2 && (
          <Button onClick={() => onCompareAnalyses(selectedForComparison)}>
            <Compare className="w-4 h-4 mr-2" />
            Comparar Selecionados
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome do paciente ou arquivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {selectedForComparison.length > 0 && (
        <Alert>
          <Compare className="h-4 w-4" />
          <AlertDescription>
            {selectedForComparison.length}/2 análises selecionadas para comparação.
            {selectedForComparison.length === 2 && ' Clique em "Comparar Selecionados" para visualizar.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum paciente encontrado." : "Nenhuma análise realizada ainda."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className={`transition-colors ${selectedForComparison.includes(patient.id) ? "ring-2 ring-primary" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{patient.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(patient.date).toLocaleDateString("pt-BR")}
                        <span>•</span>
                        <span>{patient.fileName}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {patient.mainIssues.map((issue, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {issue.substring(0, 30)}...
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={patient.confidence > 80 ? "default" : "secondary"}>
                      {patient.confidence}% confiança
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleComparison(patient.id)}
                      disabled={!selectedForComparison.includes(patient.id) && selectedForComparison.length >= 2}
                    >
                      <Compare className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onViewAnalysis(patient.analysisId)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteRecord(patient.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
