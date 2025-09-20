
"use client"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { BookOpen, Bookmark, ChevronLeft, ChevronRight, Pencil, Send } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { formatDateDMY, getFallbackImage } from '@/lib/utils'
import { pageCache } from '@/lib/cache'

type Resource = {
  id?: string;
  title: string;
  summary: string;
  type: string;
  source: string;
  date: string;
  dateOfPublication?: string;
  image?: string;
  theme?: string;
  tags?: string[];
  authors?: string;
  linkToOriginalSource?: string;
}

interface ThemeSection {
  theme: string;
  resources: Resource[];
  allResources: Resource[]; // Store all resources for navigation
  layout: 'two' | 'three'; // alternating layout types
}

// Global cache for page data
// Type definitions for cache
interface CachedData {
  data: ThemeSection[];
  timestamp: number;
  version: string;
  totalSections: number;
  totalResources: number;
}

interface OGImageCache {
  [key: string]: {
    imageUrl: string | null;
    timestamp: number;
  };
}

const CACHE_KEY = 'allThemeSections'
const CACHE_DURATION = 2 * 60 * 60 * 1000 // 2 hours
const REVALIDATE_THRESHOLD = 30 * 60 * 1000 // 30 minutes - trigger background revalidation
const OG_IMAGE_CACHE_KEY = 'ogImageCache'
const OG_IMAGE_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Individual resource component with lazy OG image loading
const ResourceCard = ({ resource, layout, onImageLoad }: {
  resource: Resource;
  layout: 'two' | 'three';
  onImageLoad: (resourceId: string, imageUrl: string) => void;
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [ogImageLoaded, setOgImageLoaded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const loadOGImageIfNeeded = useCallback(async () => {
    if (!resource.image && resource.linkToOriginalSource && !ogImageLoaded && resource.id) {
      setOgImageLoaded(true)
      try {
        const response = await fetch('/api/og-image-async', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceId: resource.id,
            url: resource.linkToOriginalSource
          })
        })

        if (response.ok) {
          const ogData = await response.json()
          if (ogData.ogImage) {
            onImageLoad(resource.id, ogData.ogImage)
          }
        }
      } catch (error) {
        console.error('Error fetching OG image:', error)
      }
    }
  }, [resource, ogImageLoaded, onImageLoad])

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
          loadOGImageIfNeeded()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [isVisible, loadOGImageIfNeeded])

  const imageUrl = resource.image || getFallbackImage(resource?.theme, resource?.tags)

  if (layout === 'two') {
    return (
      <div ref={cardRef}>
        <Link href={`/resource/${resource.id || encodeURIComponent(resource.title)}`}>
          <Card className="border-0 shadow-none p-0 h-96">
            <CardContent className="p-0 rounded-xl group overflow-hidden h-full bg-muted flex flex-col items-center">
              <div className="relative h-3/5 w-full">
                {isVisible ? (
                  <Image
                    src={imageUrl}
                    alt={resource.title}
                    width={400}
                    height={400}
                    className="w-full object-cover rounded-t-xl h-full"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getFallbackImage(resource?.theme, resource?.tags)
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted rounded-t-xl flex items-center justify-center">
                    <div className="w-16 h-16 bg-muted-foreground/20 rounded animate-pulse"></div>
                  </div>
                )}
              </div>
              <div className="w-[95%] flex flex-col justify-evenly h-2/5 space-y-3 p-2">
                <Label className="text-muted-foreground uppercase text-sm">{resource.theme || 'Theme'}</Label>
                <h2 className="text-base font-semibold line-clamp-2">{resource.title}</h2>
                <div className="flex items-center gap-1.5 text-xs">
                  <h4>{resource.source || 'Source'}</h4>
                  <span aria-hidden className="text-muted-foreground">•</span>
                  <p>{formatDateDMY(resource.dateOfPublication || resource.date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    )
  }

  // Three layout
  return (
    <div ref={cardRef}>
      <Link href={`/resource/${resource.id || encodeURIComponent(resource.title)}`}>
        <Card className="border-0 shadow-none p-0">
          <CardContent className="p-0 relative group overflow-hidden">
            {isVisible ? (
              <Image
                src={imageUrl}
                alt={resource.title}
                width={400}
                height={400}
                className="w-full h-96 object-cover rounded-xl"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getFallbackImage(resource?.theme, resource?.tags)
                }}
              />
            ) : (
              <div className="w-full h-96 bg-muted rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-muted-foreground/20 rounded animate-pulse"></div>
              </div>
            )}
            <div className="absolute w-full h-full bg-gradient-to-b from-zinc-700/10 to-zinc-900/60 left-0 top-0 justify-between py-4 items-center flex flex-col transition-all duration-200 rounded-xl">
              <div className="w-11/12 flex justify-between h-fit md:group-hover:opacity-100 md:opacity-0 transition-opacity">
                <Badge variant="secondary" className="px-2.5 py-1.5 space-x-px h-fit">
                  <BookOpen className="size-3.5" strokeWidth={1.5} />
                  <span>{resource.type}</span>
                </Badge>
              </div>
              <div className="w-11/12 flex flex-col justify-between h-fit space-y-3">
                <Label className="text-muted uppercase text-sm">{resource.theme || 'Theme'}</Label>
                <h2 className="text-base font-semibold text-white line-clamp-2">{resource.title}</h2>
                <div className="flex items-center gap-1.5 text-xs text-white">
                  <h4>{resource.source || 'Source'}</h4>
                  <span aria-hidden className="text-white/80">•</span>
                  <p>{formatDateDMY(resource.dateOfPublication || resource.date)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

const AllThemeSections = () => {
  const [themeSections, setThemeSections] = useState<ThemeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [sectionStates, setSectionStates] = useState<Record<string, { currentIndex: number; hasMore: boolean }>>({})
  const [loadedSectionCount, setLoadedSectionCount] = useState(0)
  const [allThemeData, setAllThemeData] = useState<ThemeSection[]>([])
  const [isLoadingMoreSections, setIsLoadingMoreSections] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)

  // Handle OG image updates from lazy loading
  const handleImageLoad = useCallback((resourceId: string, imageUrl: string) => {
    setThemeSections(prev => prev.map(section => ({
      ...section,
      resources: section.resources.map(resource =>
        resource.id === resourceId ? { ...resource, image: imageUrl } : resource
      )
    })))
  }, [])

  const fetchImageForSection = useCallback(async (item: Resource) => {
      if (!item?.linkToOriginalSource || !item.id) return

      // Check OG image cache first
      const ogCache =
      (pageCache.get(OG_IMAGE_CACHE_KEY) as OGImageCache | undefined) ?? ({} as OGImageCache);
     const cachedImage = ogCache[item.id]

     if (cachedImage && Date.now() - cachedImage.timestamp < OG_IMAGE_CACHE_DURATION) {
      console.log(`Using cached OG image for ${item.id}`);
      // Guard ensures we only assign a string (not null)
      if (cachedImage.imageUrl ?? false) {
        setThemeSections(prev =>
          prev.map(section => ({
            ...section,
            resources: section.resources.map(resource =>
              resource.id === item.id
                // Ensure `image` stays `string | undefined`
                ? { ...resource, image: cachedImage.imageUrl ?? resource.image }
                : resource
            ),
          }))
        );
      }
    }
    

      try {
        const response = await fetch('/api/og-image-async', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId: item.id,
            url: item.linkToOriginalSource
          })
        })

        const ogData = await response.json()
        if (ogData.ogImage && !ogData.ogImage.startsWith('/')) {
          // Cache the OG image result
          const updatedOgCache = {
            ...ogCache,
            [item.id]: {
              imageUrl: ogData.ogImage,
              timestamp: Date.now()
            }
          }
          pageCache.set(OG_IMAGE_CACHE_KEY, updatedOgCache)

          setThemeSections(prev => prev.map(section => ({
            ...section,
            resources: section.resources.map(resource =>
              resource.id === ogData.resourceId
                ? { ...resource, image: ogData.ogImage }
                : resource
            )
          })))
        } else {
          // Cache the negative result to avoid repeated requests
          const updatedOgCache = {
            ...ogCache,
            [item.id]: {
              imageUrl: null,
              timestamp: Date.now()
            }
          }
          pageCache.set(OG_IMAGE_CACHE_KEY, updatedOgCache)
        }
      } catch (error) {
        console.error('Failed to fetch OG image:', error)
        // Cache the error to avoid repeated requests
        const updatedOgCache = {
          ...ogCache,
          [item.id]: {
            imageUrl: null,
            timestamp: Date.now()
          }
        }
        pageCache.set(OG_IMAGE_CACHE_KEY, updatedOgCache)
      }
    }, [])

  // Progressive section loading function
  const loadMoreSections = useCallback(() => {
    if (isLoadingMoreSections || loadedSectionCount >= allThemeData.length) return

    setIsLoadingMoreSections(true)

    setTimeout(() => {
      const nextBatch = allThemeData.slice(loadedSectionCount, loadedSectionCount + 2) // Load 2 sections at a time
      setThemeSections(prev => [...prev, ...nextBatch])
      setLoadedSectionCount(prev => prev + nextBatch.length)
      setIsLoadingMoreSections(false)
    }, 300) // Small delay to prevent overwhelming
  }, [allThemeData, loadedSectionCount, isLoadingMoreSections])

  // Set up intersection observer for progressive loading
  useEffect(() => {
    if (!loadMoreTriggerRef.current) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMoreSections && loadedSectionCount < allThemeData.length) {
          loadMoreSections()
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    observerRef.current.observe(loadMoreTriggerRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMoreSections, isLoadingMoreSections, loadedSectionCount, allThemeData.length])

  // Move fetchImageForSection outside of the main effect to fix dependency warning
  const memoizedFetchImageForSection = useCallback(fetchImageForSection, [fetchImageForSection])

  useEffect(() => {
    let mounted = true

    async function loadAllThemes(forceRefresh = false) {
      try {
        // Check cache first
        const cached = pageCache.get(CACHE_KEY) as CachedData | undefined
        const cacheAge = cached?.timestamp ? Date.now() - cached.timestamp : Infinity
        const isCacheValid = cached && cacheAge < CACHE_DURATION
        const shouldRevalidate = cached && cacheAge > REVALIDATE_THRESHOLD

        if (isCacheValid && !forceRefresh) {
          console.log('Loading from cache progressively')
          if (mounted) {
            setAllThemeData(cached.data)
            setLoading(false)
            setThemeSections([]) // Clear existing sections for progressive load
            setLoadedSectionCount(0)

            // Initialize section states from cached data (both 2 and 3 resource sections)
            const initialStates: Record<string, { currentIndex: number; hasMore: boolean }> = {}
            cached.data.forEach((section: ThemeSection) => {
              const resourcesPerPage = section.layout === 'two' ? 2 : 3
              initialStates[section.theme] = {
                currentIndex: 0,
                hasMore: section.allResources.length > resourcesPerPage
              }
            })
            setSectionStates(initialStates)

            // Load cached OG images cache
            const ogCache: OGImageCache =
            (pageCache.get(OG_IMAGE_CACHE_KEY) as OGImageCache | undefined) ?? {};

            // Load sections progressively from cache
            cached.data.forEach((section: ThemeSection, index: number) => {
              setTimeout(() => {
                if (!mounted) return

                // Apply cached OG images for this section
                const updatedSection = {
                  ...section,
                  resources: section.resources.map((resource: Resource) => {
                    const cachedOgImage = ogCache[resource.id!]
                    if (cachedOgImage && Date.now() - cachedOgImage.timestamp < OG_IMAGE_CACHE_DURATION && cachedOgImage.imageUrl) {
                      return { ...resource, image: cachedOgImage.imageUrl }
                    }
                    return resource
                  })
                }

                setThemeSections(prev => [...prev, updatedSection])
                setLoadedSectionCount(prev => prev + 1)

                // Prefetch OG images for resources that don't have them
                const visibleResources = section.resources.slice(0, section.layout === 'two' ? 2 : 3)
                visibleResources.forEach((resource: Resource) => {
                  if (resource.linkToOriginalSource && !resource.image) {
                    memoizedFetchImageForSection(resource)
                  }
                })
              }, index * 150) // Stagger by 150ms per section
            })

            // Trigger background revalidation if cache is getting stale
            if (shouldRevalidate) {
              console.log('Triggering background revalidation')
              setTimeout(() => loadAllThemes(true), 100)
            }
          }
          return
        }

        console.log(forceRefresh ? 'Force refreshing data' : 'Loading fresh data')

        // Get themes dynamically from search results (like search page does)
        // First, get a large sample of all resources to extract themes from
        const allResourcesRes = await fetch('/api/search?query=prison&limit=100')
        const allResourcesJson = await allResourcesRes.json()
        const allResources: Resource[] = Array.isArray(allResourcesJson.data) ? allResourcesJson.data : []

        // Extract and rank themes from search results (same logic as search page)
        const allThemes = allResources.map(resource => resource.theme).filter((theme): theme is string => Boolean(theme))
        const themeFrequency = allThemes.reduce((acc, theme) => {
          if (theme && theme.trim()) {
            const cleanTheme = theme.trim()
            const lowerKey = cleanTheme.toLowerCase()
            if (!acc[lowerKey]) {
              acc[lowerKey] = { count: 0, displayName: cleanTheme }
            }
            acc[lowerKey].count += 1
          }
          return acc
        }, {} as Record<string, { count: number, displayName: string }>)

        const themes = Object.values(themeFrequency)
          .sort((a, b) => b.count - a.count)
          .slice(0, 15) // Show top 15 themes
          .map(item => ({ name: item.displayName, count: item.count }))

        console.log('Dynamic themes from search results:', themes.map(t => `${t.name} (${t.count})`))

        // Process each theme progressively - show them as they load
        const sections: ThemeSection[] = []
        let processedCount = 0

        // Initialize section states storage
        const allSectionStates: Record<string, { currentIndex: number; hasMore: boolean }> = {}

        // Set loading to false immediately so we can show progressive content
        if (mounted) {
          setLoading(false)
          setThemeSections([]) // Clear existing sections for fresh load
          setLoadedSectionCount(0)
        }

        for (let i = 0; i < themes.length; i++) { // Process all available themes
          const theme = themes[i]
          const layout = i % 2 === 0 ? 'two' : 'three' // Alternate between 2 and 3 resources
          const resourceCount = layout === 'two' ? 2 : 3

          console.log(`Processing theme ${i + 1}/${themes.length}: "${theme.name}" (layout: ${layout}, need: ${resourceCount})`)

          try {
            // Fetch more resources initially to have enough for navigation
            const searchUrl = `/api/search?themes=${encodeURIComponent(theme.name)}&limit=10`
            console.log(`Fetching: ${searchUrl}`)

            const resourcesRes = await fetch(searchUrl)
            const resourcesJson = await resourcesRes.json()
            const allResourcesForTheme: Resource[] = Array.isArray(resourcesJson.data) ? resourcesJson.data : []

            console.log(`  Found ${allResourcesForTheme.length} resources for "${theme.name}"`)

            // Take the exact number we need for initial display, even if we have fewer
            const resources = allResourcesForTheme.slice(0, resourceCount)

            // Show themes even if they have fewer resources than ideal
            if (resources.length > 0 && mounted) {
              const newSection: ThemeSection = {
                theme: theme.name,
                resources, // Initial visible resources
                allResources: allResourcesForTheme, // Store all for navigation
                layout
              }

              sections.push(newSection)

              // Add this section immediately to the displayed sections
              setThemeSections(prev => [...prev, newSection])

              // Update section states for navigation
              const resourcesPerPage = layout === 'two' ? 2 : 3
              allSectionStates[theme.name] = {
                currentIndex: 0,
                hasMore: allResourcesForTheme.length > resourcesPerPage
              }

              setSectionStates(prev => ({
                ...prev,
                [theme.name]: {
                  currentIndex: 0,
                  hasMore: allResourcesForTheme.length > resourcesPerPage
                }
              }))

              processedCount++
              console.log(`  ✅ Added and displayed section for "${theme.name}" with ${resources.length} visible resources, ${allResourcesForTheme.length} total`)

              // Fetch images for newly visible resources
              setTimeout(() => {
                resources.forEach((resource: Resource) => {
                  if (resource.linkToOriginalSource && !resource.image) {
                    memoizedFetchImageForSection(resource)
                  }
                })
              }, 50)

              // Small delay between sections to prevent overwhelming the UI
              await new Promise(resolve => setTimeout(resolve, 100))
            } else {
              console.log(`  ❌ No resources found for theme: ${theme.name}`)
            }
          } catch (error) {
            console.error(`  💥 Error fetching resources for theme ${theme.name}:`, error)
          }
        }

        console.log(`🎯 FINAL RESULT: Total themes available: ${themes.length}, Sections created: ${sections.length}`)
        console.log('Created sections:', sections.map(s => `${s.theme} (${s.resources.length} resources, ${s.layout})`))

        if (mounted) {
          setAllThemeData(sections)
          setLoadedSectionCount(sections.length)

          // Cache the data with metadata
          pageCache.set(CACHE_KEY, {
            data: sections,
            timestamp: Date.now(),
            version: '1.0',
            totalSections: sections.length,
            totalResources: sections.reduce((acc, section) => acc + section.allResources.length, 0)
          }, CACHE_DURATION / 1000) // Cache for 2 hours in seconds
        }
      } catch (error) {
        console.error('Error loading themes:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadAllThemes()

    return () => {
      mounted = false
    }
  }, [memoizedFetchImageForSection])

  const handleNext = (sectionTheme: string, allResources: Resource[], layout: 'two' | 'three') => {
    const currentState = sectionStates[sectionTheme]
    if (!currentState) return

    const resourcesPerPage = layout === 'two' ? 2 : 3
    const nextIndex = currentState.currentIndex + resourcesPerPage
    const nextResources = allResources.slice(nextIndex, nextIndex + resourcesPerPage)

    if (nextResources.length > 0) {
      setSectionStates(prev => ({
        ...prev,
        [sectionTheme]: {
          currentIndex: nextIndex,
          hasMore: allResources.length > nextIndex + resourcesPerPage
        }
      }))

      // Update the section's visible resources
      setThemeSections(prev => prev.map(section =>
        section.theme === sectionTheme
          ? { ...section, resources: nextResources }
          : section
      ))

      // Fetch images for newly visible resources
      nextResources.forEach((resource: Resource) => {
        if (resource?.linkToOriginalSource) {
          memoizedFetchImageForSection(resource)
        }
      })
    } else {
      setSectionStates(prev => ({
        ...prev,
        [sectionTheme]: {
          ...prev[sectionTheme],
          hasMore: false
        }
      }))
    }
  }

  const handlePrevious = (sectionTheme: string, allResources: Resource[], layout: 'two' | 'three') => {
    const currentState = sectionStates[sectionTheme]
    if (!currentState) return

    const resourcesPerPage = layout === 'two' ? 2 : 3
    const prevIndex = Math.max(0, currentState.currentIndex - resourcesPerPage)

    if (prevIndex >= 0) {
      const prevResources = allResources.slice(prevIndex, prevIndex + resourcesPerPage)

      setSectionStates(prev => ({
        ...prev,
        [sectionTheme]: {
          currentIndex: prevIndex,
          hasMore: allResources.length > prevIndex + resourcesPerPage
        }
      }))

      // Update the section's visible resources
      setThemeSections(prev => prev.map(section =>
        section.theme === sectionTheme
          ? { ...section, resources: prevResources }
          : section
      ))

      // Fetch images for newly visible resources
      prevResources.forEach((resource: Resource) => {
        if (resource?.linkToOriginalSource) {
          memoizedFetchImageForSection(resource)
        }
      })
    }
  }

  const renderTwoResourceLayout = (section: ThemeSection) => {
    const sectionState = sectionStates[section.theme] || { currentIndex: 0, hasMore: false }

    return (
    <div className="w-11/12 md:w-10/12 flex flex-col items-center justify-center space-y-6">
      <div className="flex items-center justify-between text-muted-foreground w-full">
        <h3 className="font-medium text-lg">{section.theme}</h3>
        <div className="flex items-center gap-2">
          {sectionState.currentIndex > 0 && (
            <Button
              onClick={() => handlePrevious(section.theme, section.allResources, section.layout)}
              variant="outline"
              size="sm"
              className="flex items-center hover:bg-brand-secondary-50 border-brand-secondary-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          {sectionState.hasMore && (
            <Button
              onClick={() => handleNext(section.theme, section.allResources, section.layout)}
              variant="outline"
              size="sm"
              className="flex items-center hover:bg-brand-secondary-50 border-brand-secondary-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-6 md:gap-0 md:flex-row w-full justify-between h-fit">
        {section.resources.slice(0, 2).map((item, index) => (
          <Link key={item.id || index} href={`/resource/${item.id || encodeURIComponent(item.title)}`} className="block w-full md:w-5/12">
            <Card className="border-0 shadow-none p-0 h-fit md:h-96 w-full" data-card-id={item.id || item.title}>
              <CardContent className="p-0 relative group overflow-hidden h-full w-full">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={400}
                    height={400}
                    className="w-full h-80 object-cover rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getFallbackImage(item?.theme, item?.tags)
                    }}
                  />
                ) : (
                  <Image src={getFallbackImage(item?.theme, item?.tags)} alt="Default" width={400} height={400} className="w-full h-80 object-cover rounded-xl" />
                )}
                <div className="absolute w-full h-full left-0 top-0  justify-center py-6 md:group-hover:opacity-100 md:opacity-0 flex  transition-all duration-200">
                  <div className="w-11/12 flex justify-between h-fit">
                    <Badge variant="secondary" className="px-2.5 py-1.5 space-x-px h-fit">
                      <BookOpen className="size-3.5" strokeWidth={1.5} />
                      <span>{item.type || 'Article'}</span>
                    </Badge>
                    <div className="flex flex-col items-center gap-3">
                      <Button className="rounded-full bg-primary/50 backdrop-blur-xs text-white border-none" variant="outline" size="icon" >
                        <Send className="size-4" strokeWidth={1.5} />
                      </Button>
                      <Button className="rounded-full bg-primary/50 backdrop-blur-xs text-white border-none" variant="outline" size="icon" >
                        <Bookmark className="size-4" strokeWidth={1.5} />
                      </Button>
                      <Button className="rounded-full bg-primary/50 backdrop-blur-xs text-white border-none" variant="outline" size="icon" >
                        <Pencil className="size-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start p-0 space-y-3">
                <Label className="text-muted-foreground uppercase">{item.tags?.[0] || item.theme || section.theme || 'Theme'}</Label>
                <h2 className="text-lg md:text-2xl font-semibold text-brand-primary-900 line-clamp-2">{item.title || 'Resource Title'}</h2>
                <div className="flex items-center gap-2">
                  <Avatar className="rounded-full size-6">
                    <AvatarImage
                      src="https://github.com/evilrabbit.jpg"
                      alt="author"
                    />
                    <AvatarFallback className="text-xs">{(item.authors || 'A').slice(0,1)}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1.5 text-sm">
                    <h4>{item.source || 'Source'}</h4>
                    <span aria-hidden className="text-muted-foreground">•</span>
                    <p>{formatDateDMY(item.dateOfPublication || item.date || '')}</p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </section>

      {section.resources.length === 0 && (
        <div className="w-full text-sm text-muted-foreground">No resources found for this theme.</div>
      )}
    </div>
    )
  }

  const renderThreeResourceLayout = (section: ThemeSection) => {
    const sectionState = sectionStates[section.theme] || { currentIndex: 0, hasMore: false }

    return (
    <div className="w-11/12 md:w-10/12 flex flex-col items-center justify-center space-y-6">
      <div className="flex items-center justify-between text-muted-foreground w-full">
        <h3 className="font-medium text-lg">{section.theme}</h3>
        <div className="flex items-center gap-2">
          {sectionState.currentIndex > 0 && (
            <Button
              onClick={() => handlePrevious(section.theme, section.allResources, section.layout)}
              variant="outline"
              size="sm"
              className="flex items-center hover:bg-brand-secondary-50 border-brand-secondary-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          {sectionState.hasMore && (
            <Button
              onClick={() => handleNext(section.theme, section.allResources, section.layout)}
              variant="outline"
              size="sm"
              className="flex items-center hover:bg-brand-secondary-50 border-brand-secondary-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {section.resources.map((resource, idx) => (
          <ResourceCard
            key={resource.id || idx}
            resource={resource}
            layout="three"
            onImageLoad={handleImageLoad}
          />
        ))}
      </div>
    </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-16">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="w-11/12 md:w-10/12 space-y-6">
            <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
            <div className={`grid grid-cols-1 ${idx % 2 === 0 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
              {[...Array(idx % 2 === 0 ? 2 : 3)].map((_, cardIdx) => (
                <div key={cardIdx} className="h-96 bg-muted rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {themeSections.map((section) => (
        <React.Fragment key={section.theme}>
          {section.layout === 'two' ? renderTwoResourceLayout(section) : renderThreeResourceLayout(section)}
        </React.Fragment>
      ))}

      {/* Loading trigger for progressive loading */}
      {loadedSectionCount < allThemeData.length && (
        <div ref={loadMoreTriggerRef} className="w-full flex justify-center py-8">
          {isLoadingMoreSections ? (
            <div className="w-11/12 md:w-10/12 space-y-6">
              <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, cardIdx) => (
                  <div key={cardIdx} className="h-96 bg-muted rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Loading more sections...</div>
          )}
        </div>
      )}
    </>
  )
}

export default AllThemeSections
