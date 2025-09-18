import { NextResponse } from 'next/server'
import { getResourcesByKeywords } from '@/lib/weaviate-util'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keywordsParam = searchParams.get('keywords')
    const limitParam = searchParams.get('limit')

    if (!keywordsParam) {
      return NextResponse.json({ error: 'Keywords parameter is required' }, { status: 400 })
    }

    // Parse keywords from comma-separated string
    const keywords = keywordsParam.split(',').map(k => k.trim()).filter(Boolean)
    const limit = limitParam ? parseInt(limitParam, 10) : 20

    if (keywords.length === 0) {
      return NextResponse.json({ error: 'At least one keyword is required' }, { status: 400 })
    }

    const data = await getResourcesByKeywords(keywords, limit)
    return NextResponse.json({ data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /resources-by-keywords error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}