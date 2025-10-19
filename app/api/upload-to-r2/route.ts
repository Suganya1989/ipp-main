import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToR2 } from '@/lib/r2-util'
import { updateResourceImage } from '@/lib/weaviate-util'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, resourceId } = body

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId is required' }, { status: 400 })
    }

    // Upload the image to Cloudflare R2
    const r2Url = await uploadImageToR2(imageUrl, resourceId)

    // Update the resource in the database with the R2 URL
    const success = await updateResourceImage(resourceId, r2Url)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update resource with R2 URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      r2Url,
      message: 'Image uploaded to R2 and database updated successfully',
    })
  } catch (error) {
    console.error('Error uploading to R2:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload image to R2',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
