"use client"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Bookmark, BookOpen, ChevronLeft, ChevronRight, Pencil, Send, Sparkle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { pageCache } from '@/lib/cache'

type Resource = {
  id?: string;
  title: string;
  summary: string;
  type: string;
  source: string;
  date: string;
  image?: string;
  theme?: string;
  tags?: string[];
  authors?: string;
  linkToOriginalSource?: string;
}

const RulesAndFramework = () => {
  const [allResources, setAllResources] = useState<Resource[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<string>("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasMore, setHasMore] = useState(false)


  const fetchImage = useCallback(async (item: Resource) => {
      if (!item?.linkToOriginalSource) return
      
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
          setResources((prevItems: Resource[]) => 
            prevItems.map(prevItem => 
              prevItem.id === ogData.resourceId 
                ? { ...prevItem, image: ogData.ogImage }
                : prevItem
            )
          )
        }
      } catch (error) {
        console.error('Failed to fetch OG image:', error)
      }
    }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        // Check cache first
        const cacheKey = 'rules-framework-data'
        const cachedData = pageCache.get(cacheKey) as {
          allResources: Resource[]
          theme: string
        } | null

        if (cachedData && mounted) {
          console.log('[RulesAndFramework] Using cached data')
          setAllResources(cachedData.allResources)
          setTheme(cachedData.theme)
          const currentPageResources = cachedData.allResources.slice(0, 2)
          setResources(currentPageResources)
          setHasMore(cachedData.allResources.length > 2)
          setLoading(false)
          
          // Fetch images only for visible resources (first 2)
          currentPageResources.forEach((resource: Resource) => {
            if (resource?.linkToOriginalSource) {
              fetchImage(resource)
            }
          })
          return
        }

        // 1) Fetch themes sorted by count (trending)
        const themesRes = await fetch('/api/themes')
        const themesJson = await themesRes.json()
        const themes: { name: string; count: number }[] = Array.isArray(themesJson.data) ? themesJson.data : []
        // Pick the 2nd most trending theme (index 1), fallback to 1st then 3rd
        const nextTrending = themes[1]?.name || themes[0]?.name || themes[2]?.name || ''
        if (!mounted) return
        setTheme(nextTrending)

        if (nextTrending) {
          // 2) Fetch resources for that theme using getResourcesByTheme
          const res = await fetch(`/api/theme-resources?theme=${encodeURIComponent(nextTrending)}&limit=10`)
          const json = await res.json()
      
          const resourceData = Array.isArray(json.resources) ? json.resources : []
          
          // Set initial resources without fallback images to allow OG images to show
          const initialResources = resourceData.map((item: Resource) => ({
            ...item,
            image: item.image || undefined
          }))
          
          // Cache the data for 5 minutes
          pageCache.set(cacheKey, {
            allResources: initialResources,
            theme: nextTrending
          }, 300)
          
          setAllResources(initialResources)
          const currentPageResources = initialResources.slice(0, 2)
          setResources(currentPageResources)
          setHasMore(initialResources.length > 2)
          
          // Fetch images only for visible resources (first 2)
          currentPageResources.forEach((resource: Resource) => {
            if (resource?.linkToOriginalSource) {
              fetchImage(resource)
            }
          })
        } else {
          setResources([])
        }
      } catch (e) {
        console.error('Failed to load Rules & Framework resources', e)
        if (mounted) setResources([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [fetchImage])

  const cards = resources.slice(0, 2)

  const handleNext = () => {
    const nextIndex = currentIndex + 2
    const nextResources = allResources.slice(nextIndex, nextIndex + 2)
    
    if (nextResources.length > 0) {
      setResources(nextResources)
      setCurrentIndex(nextIndex)
      setHasMore(allResources.length > nextIndex + 2)
      
      // Fetch images for newly visible resources
      nextResources.forEach((resource: Resource) => {
        if (resource?.linkToOriginalSource) {
          fetchImage(resource)
        }
      })
    } else {
      setHasMore(false)
    }
  }

  const handlePrevious = () => {
    const prevIndex = currentIndex - 2
    if (prevIndex >= 0) {
      const prevResources = allResources.slice(prevIndex, prevIndex + 2)
      
      setResources(prevResources)
      setCurrentIndex(prevIndex)
      setHasMore(allResources.length > prevIndex + 2)
      // OG images will be loaded automatically by Intersection Observer
    }
  }

  return (
    <div className="w-11/12 md:w-10/12 flex flex-col items-center justify-center space-y-6">
      <div className="flex items-center justify-between text-muted-foreground w-full">
        <h3 className="font-medium text-lg">{theme || 'Rules, Standards, and International Frameworks'}</h3>
        <div className="flex items-center gap-2">
          {currentIndex > 0 && (
            <Button 
              onClick={handlePrevious}
              variant="outline" 
              size="sm"
              className="flex items-center hover:bg-brand-secondary-50 border-brand-secondary-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          {hasMore && (
            <Button 
              onClick={handleNext}
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
        {loading && (
          <>
            {[0,1].map((i) => (
              <div key={`sk-${i}`} className="w-full md:w-[45%] space-y-6">
                <Card className="border-0 shadow-none p-0">
                  <CardContent className="p-0">
                    <div className="w-full h-80 rounded-xl bg-muted animate-pulse" />
                  </CardContent>
                  <CardFooter className="flex flex-col items-start p-0 space-y-3">
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                      <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                    </div>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </>
        )}
        {!loading && cards.map((item, index) => (
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
                      target.src = "/Rules1.png";
                    }}
                  />
                ) : (
                  <Image src="/Rules1.png" alt="Default" width={400} height={400} className="w-full h-80 object-cover rounded-xl" />
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
                <Label className="text-muted-foreground uppercase">{item.tags?.[0] || item.theme || theme || 'Theme'}</Label>
                <h2 className="text-lg md:text-2xl font-semibold text-brand-primary-900 line-clamp-2">{item.title || 'Resource Title'}</h2>
                <div className="flex items-center gap-2">
                  <Avatar className="rounded-full size-6">
                    <AvatarImage
                      src="https://github.com/evilrabbit.jpg"
                      alt="author"
                    />
                    <AvatarFallback className="text-xs">{(item.authors || 'A').slice(0,1)}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 text-sm">
                    <h4>{item.source || 'Source'}</h4>
                    <Sparkle className="size-3 text-muted" strokeWidth={1.5} fill="" />
                    <p>{item.date || ''}</p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </section>

      {!loading && cards.length === 0 && (
        <div className="w-full text-sm text-muted-foreground">No resources found for the trending theme.</div>
      )}
    </div>
  )
}

export default RulesAndFramework