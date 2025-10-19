import { NextResponse } from 'next/server'
import getClient from '@/lib/weaviate-util'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      resourceUrl,
      title,
      summary,
      resourceType,
      location,
      theme,
      tags
    } = body

    // Validate required fields
    if (!title || !summary || !resourceUrl) {
      return NextResponse.json(
        { error: 'Title, summary, and resource URL are required' },
        { status: 400 }
      )
    }

    const client = getClient()

    // Prepare the data object for Weaviate
    const resourceData = {
      source_title: title,
      summary: summary,
      sourceType: resourceType || 'contribution',
      sourcePlatform: 'User Contribution',
      authors: name || 'Anonymous',
      linkToOriginalSource: resourceUrl,
      dateOfPublication: new Date().toISOString().split('T')[0], // Current date
      theme: theme || 'General',
      subTheme: '', // Can be added later if needed
      keywords: Array.isArray(tags) ? tags.join(', ') : (tags || ''),
      location: location || 'National',
      // Additional metadata
      contributorEmail: email || '',
      contributedAt: new Date().toISOString(),
      status: 'pending_review' // Mark as pending review
    }

    console.log('Saving contribution to Weaviate:', resourceData)

    // Insert the data into Weaviate
    const result = await client.data
      .creator()
      .withClassName('DocsWithImages')
      .withProperties(resourceData)
      .do()

    console.log('Contribution saved successfully:', result)

    return NextResponse.json({
      success: true,
      message: 'Contribution saved successfully for review',
      id: result.id
    })

  } catch (error: unknown) {
    console.error('Error saving contribution:', error)
    const message = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save contribution: ' + message
      },
      { status: 500 }
    )
  }
}