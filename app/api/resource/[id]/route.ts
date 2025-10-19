import { NextResponse } from 'next/server'
import { getResourceByIdOrTitle, updateResourceImage } from '@/lib/weaviate-util'

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
    console.log(resource);
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 })
    }

    if (!body.imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    const success = await updateResourceImage(id, body.imageUrl)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update resource image' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Image updated successfully' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /resource/[id] PATCH error', message)
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
  }
}
