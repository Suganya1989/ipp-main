import { NextResponse } from 'next/server'
import { getTypes } from '@/lib/weaviate-util'

// Cache for types data
let typesCache: { data: string[], timestamp: number } | null = null
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export async function GET() {
  try {
    const now = Date.now()

    // Check if we have valid cached data
    if (typesCache && (now - typesCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached types data')
      return NextResponse.json({ data: typesCache.data })
    }

    // Fetch fresh data from database
    console.log('Fetching fresh types data from database')
    const data = await getTypes()

    // Update cache
    typesCache = {
      data: data,
      timestamp: now
    }

    return NextResponse.json({ data: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /types error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}