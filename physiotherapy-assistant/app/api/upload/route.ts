import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Tipo de arquivo não suportado. Use JPEG, PNG, WebP, MP4 ou WebM",
        },
        { status: 400 },
      )
    }

    // Validar tamanho (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "Arquivo muito grande. Máximo 50MB",
        },
        { status: 400 },
      )
    }

    // Converter para base64 para processamento
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
      },
    })
  } catch (error) {
    console.error("Erro no upload:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
