"use client"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { BookOpen, Bookmark, ChevronLeft, ChevronRight, Pencil, Send } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
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

interface OverCrowdingProps {
  themeIndex?: number;
}

const OverCrowding = ({ themeIndex }: OverCrowdingProps) => {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<string>("")
  const [cards, setCards] = useState<Resource[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const itemsPerPage = 2

  useEffect(() => {
    let mounted = true
    async function load() {
      try {

        const themesRes = await fetch('/api/themes')
        const themesJson = await themesRes.json()
        const themes: { name: string; count: number }[] = Array.isArray(themesJson.data) ? themesJson.data : []
        const index = typeof themeIndex === 'number' ? Math.min(Math.max(themeIndex, 0), Math.max(0, themes.length - 1)) : 0
        const nextTrending = themes[index]?.name || themes[0]?.name || ''
        console.log('[OverCrowding] Selected theme:', nextTrending)
        if (!mounted)
        {
          console.log("not mounted overcrowded") 
          return;
        }
        else
          console.log("mounted overcrowded")
        setTheme(nextTrending)

        // Check cache per theme
        const cacheKey = `overcrowding-data-${nextTrending}`
        const cachedData = pageCache.get(cacheKey) as {
          resources: Resource[]
          theme: string
        } | null
        if (cachedData && mounted) {
          console.log('[OverCrowding] Using cached data for theme', nextTrending)
          setResources(cachedData.resources)
          setCards(cachedData.resources.slice(0, 2))
          setHasMore(cachedData.resources.length > 2)
          setLoading(false)
          return
        }

        if (nextTrending) {
          console.log("API call for overcrowding section")
          const res = await fetch(`/api/theme-resources?theme=${encodeURIComponent(nextTrending)}&limit=10`)
          const json = await res.json()
          console.log('[OverCrowding] Theme resources response:', json)
         
          
          const resourceData = Array.isArray(json.resources) ? json.resources : []
          console.log('[OverCrowding] Resource data:', resourceData.length, 'items')
          
          // Set initial resources without images to allow OG images to show
          const initialResources = resourceData.map((item: Resource) => ({
            ...item,
            image: item.image || undefined
          }))
          
          // Cache the data for 5 minutes (per theme)
          pageCache.set(cacheKey, {
            resources: initialResources,
            theme: nextTrending
          }, 300)
          
          setResources(initialResources)
          setCards(initialResources.slice(0, 2))
          setHasMore(initialResources.length > 2)
        } else {
          console.log('[OverCrowding] No theme selected or no resources found')
          setResources([])
          setCards([])
          setHasMore(false)
        }
      } catch (error) {
        console.error('[OverCrowding] Error loading resources:', error)
        if (mounted) {
          setResources([])
          setCards([])
          setHasMore(false)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [themeIndex])

  // Load OG images asynchronously - original approach
  const loadOGImages = (resources: Resource[]) => {
    resources.forEach((item: Resource) => {
      if (item.linkToOriginalSource && item.linkToOriginalSource.startsWith('http')) {
        fetch('/api/og-image-async', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId: item.id,
            url: item.linkToOriginalSource
          })
        })
        .then(res => res.json())
        .then(ogData => {
          console.log('OverCrowding: OG API response:', ogData)
          // Only update if we got a real OG image (not a fallback starting with /)
          if (ogData.ogImage && !ogData.ogImage.startsWith('/')) {
            console.log('OverCrowding: Real OG image received for', ogData.resourceId, ogData.ogImage)
            setCards(prevCards => {
              const updated = prevCards.map(prevItem => 
                prevItem.id === ogData.resourceId 
                  ? { ...prevItem, image: ogData.ogImage }
                  : prevItem
              )
              console.log('OverCrowding: Updated cards with real OG image:', updated)
              return updated
            })
          } else {
            console.log('OverCrowding: Got fallback image or no image for', item.linkToOriginalSource, ogData.ogImage)
          }
        })
        .catch((error) => {
          console.log('OverCrowding: OG image fetch failed for', item.linkToOriginalSource, error)
        })
      }
    })
  }

  // Intersection Observer for loading images when cards become visible
  const createImageObserver = useCallback((): IntersectionObserver => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardElement = entry.target as HTMLElement
            const cardId = cardElement.dataset.cardId
            const card = cards.find(c => (c.id || c.title) === cardId)
            
            console.log(`[OverCrowding] Card intersecting:`, {
              cardId,
              cardFound: !!card,
              cardTitle: card?.title,
              hasImage: !!card?.image,
              linkToOriginalSource: card?.linkToOriginalSource
            })
            
            if (card && !card.image) {
              console.log(`[OverCrowding] Loading OG image for visible card: ${card.title}`)
              loadOGImages([card])
            } else if (card && card.image) {
              console.log(`[OverCrowding] Card already has image: ${card.title} - ${card.image}`)
            }
            observer.unobserve(entry.target)
          }
        })
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    )
    return observer
  }, [cards])

  // Setup observer when cards are ready
  useEffect(() => {
    if (!loading && cards.length > 0) {
      const observer = createImageObserver()

      const timeoutId = setTimeout(() => {
        const cardElements = document.querySelectorAll('[data-card-id]')
        cardElements.forEach(el => observer.observe(el))
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        observer.disconnect()
      }
    }
  }, [cards, loading, createImageObserver])

  const handleNext = () => {
    const nextStartIndex = (currentPage + 1) * itemsPerPage
    const nextCards = resources.slice(nextStartIndex, nextStartIndex + itemsPerPage)
    
    if (nextCards.length > 0) {
      setCards(nextCards)
      setCurrentPage(currentPage + 1)
      setHasMore(resources.length > nextStartIndex + itemsPerPage)
    }
  }

  const handlePrevious = () => {
    if (currentPage > 0) {
      const prevStartIndex = (currentPage - 1) * itemsPerPage
      const prevCards = resources.slice(prevStartIndex, prevStartIndex + itemsPerPage)
      setCards(prevCards)
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="w-11/12 md:w-10/12 flex flex-col items-center justify-center space-y-6">
      <div className="flex items-center justify-between text-muted-foreground w-full">
        <h3 className="font-medium text-lg">{theme || 'Overcrowding, Recidivism and Alternatives to Imprisonment'}</h3>
        <div className="flex items-center gap-2">
          {currentPage > 0 && (
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
              <Card 
                className="border-0 shadow-none p-0 h-fit md:h-96 w-full"
                data-card-id={item.id || item.title}
              >
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
                  <Image src={getFallbackImage(item?.theme, item?.tags)} alt="Default" width={400} height={400} className="w-full h-80 object-cover rounded-xl" />
                )}
                <div className="absolute w-full h-full left-0 top-0  justify-center py-6 group-hover:opacity-100 opacity-0 flex  transition-all duration-200">
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
                <h2 className="text-2xl font-semibold text-brand-primary-900 line-clamp-2">{item.title || 'Resource Title'}</h2>
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
      {!loading && cards.length === 0 && (
        <div className="w-full text-sm text-muted-foreground">No resources found for the trending theme.</div>
      )}
    </div>
  )
}

export default OverCrowding