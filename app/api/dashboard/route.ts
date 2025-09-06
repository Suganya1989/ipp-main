import { NextResponse } from 'next/server'
import { getThemesWithCounts, getResourcesByTheme } from '@/lib/weaviate-util'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitPerTheme = Number(searchParams.get('limitPerTheme') ?? '2')
    
    // First get all themes with counts
    const themes = await getThemesWithCounts()
    
    if (!themes || themes.length === 0) {
      return NextResponse.json({ 
        themes: [],
        resources: [],
        totalThemes: 0 
      })
    }

    // Fetch resources for each theme (limit 2 per theme by default)
    const themeResourcePromises = themes.map(async (theme) => {
      const resources = await getResourcesByTheme(theme.name, limitPerTheme)
      return {
        theme: theme.name,
        count: theme.count,
        href: theme.href,
        resources: resources
      }
    })

    // Wait for all theme resources to be fetched
    const themeResources = await Promise.all(themeResourcePromises)
    
    // Flatten all resources for easy access
    const allResources = themeResources.flatMap(tr => 
      tr.resources.map(resource => ({
        ...resource,
        themeCategory: tr.theme
      }))
    )

    // Return resources immediately without OG image fetching for fast loading
    const resourcesWithOGImages = allResources

    // Update theme resources with OG images
    const updatedThemeResources = themeResources.map(tr => ({
      ...tr,
      resources: tr.resources.map(resource => {
        const updatedResource = resourcesWithOGImages.find(r => r.id === resource.id)
        return updatedResource || resource
      })
    }))

    return NextResponse.json({
      themes: updatedThemeResources,
      resources: resourcesWithOGImages,
      totalThemes: themes.length,
      totalResources: resourcesWithOGImages.length
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /dashboard error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
