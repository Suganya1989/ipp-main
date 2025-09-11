import { NextResponse } from 'next/server'
import { getResourcesByTheme } from '@/lib/weaviate-util'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const themeParam = searchParams.get('theme')
    const limit = Number(searchParams.get('limit') ?? '10')

    if (!themeParam) {
      return NextResponse.json({ error: 'Theme parameter is required' }, { status: 400 })
    }

    // Decode URL-encoded theme parameter
    const theme = decodeURIComponent(themeParam)

    const resources = await getResourcesByTheme(theme, limit)
    return NextResponse.json({ resources })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /theme-resources error', message)
    return NextResponse.json({ error: 'Failed to fetch theme resources' }, { status: 500 })
  }
}
