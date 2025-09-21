import { NextResponse } from 'next/server'
import { searchResourcesByKeyword, searchResourcesWithFilters } from '@/lib/weaviate-util'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    console.log(searchParams);
    const query = searchParams.get('query') || ''
    const limit = Number(searchParams.get('limit') ?? '20')

    // Optional filters
    const sourceTypes = searchParams.getAll('sourceTypes')
    const themes = searchParams.getAll('themes')
    const sources = searchParams.getAll('sources')
    const authors = searchParams.getAll('authors')
    const locations = searchParams.getAll('locations')
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined

    const hasAnyFilter = [sourceTypes, themes, sources, authors, locations].some(arr => arr && arr.length > 0) || from || to

    const data = hasAnyFilter
      ? await searchResourcesWithFilters(query, {
          types: sourceTypes.length ? sourceTypes : undefined,
          themes: themes.length ? themes : undefined,
          sources: sources.length ? sources : undefined,
          authors: authors.length ? authors : undefined,
          locations: locations.length ? locations : undefined,
          dateRange: from || to ? { from, to } : undefined,
        }, limit)
      : await searchResourcesByKeyword(query, limit)

    return NextResponse.json({ data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /search error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
