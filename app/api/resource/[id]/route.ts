import { NextResponse } from 'next/server'
import { getResourceByIdOrTitle } from '@/lib/weaviate-util'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 })
    }

    const resource = await getResourceByIdOrTitle(id)
    
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    return NextResponse.json({ resource })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /resource/[id] error', message)
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 })
  }
}
