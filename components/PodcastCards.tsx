"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bookmark, ChevronLeft, ChevronRight, FileText, Pencil, Send, Sparkle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
  themeCategory?: string;
}

interface PodcastCardsProps {
  startIndex?: number;
}

const PodcastCards = ({ startIndex = 0 }: PodcastCardsProps) => {
  const [items, setItems] = useState<Resource[]>([])
  const [allItems, setAllItems] = useState<Resource[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [theme, setTheme] = useState<string>("")
  const router = useRouter()

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
        setItems((prevItems: Resource[]) => 
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
        const cacheKey = `podcast-data-${startIndex}`
        const cachedData = pageCache.get(cacheKey) as Resource[] | null

        if (cachedData && mounted) {
          console.log('[PodcastCards] Using cached data')
          const { allPodcastItems, themeName } = cachedData
          setAllItems(allPodcastItems)
          setTheme(themeName)
          
          // Show first 3 items from the cached theme
          const initialItems = allPodcastItems.slice(0, 3)
          setItems(initialItems)
          setCurrentIndex(0)
          setHasMore(allPodcastItems.length > 3)
          return
        }

        // Get themes first, then fetch resources using getResourcesByTheme
        const themesRes = await fetch('/api/themes')
        const themesData = await themesRes.json()
        
        if (!mounted) return
        
        const themes = Array.isArray(themesData.data) ? themesData.data : []
        
        // Pick theme by position: first section uses first theme, second uses next theme, etc.
        const themeIndex = Math.min(Math.floor(startIndex / 3), Math.max(0, themes.length - 1))
        const selectedTheme = themes[themeIndex]?.name || themes[0]?.name || ''
        
        // Fetch resources for the selected theme only
        let allThemeResources: Resource[] = []
        if (selectedTheme) {
          try {
            const res = await fetch(`/api/theme-resources?theme=${encodeURIComponent(selectedTheme)}&limit=15`)
            const json = await res.json()
            
            if (json.resources && Array.isArray(json.resources)) {
              allThemeResources = json.resources.map((resource: Resource) => ({
                ...resource,
                themeCategory: selectedTheme
              }))
            }
          } catch (error) {
            console.error(`Failed to fetch resources for theme ${selectedTheme}:`, error)
          }
        }
        
        // Set all items without fallback images to allow OG images to show
        const allPodcastItems = allThemeResources.map((item: Resource) => ({
          ...item,
          image: item.image || undefined
        }))
        
        // Cache the data for 5 minutes
        pageCache.set(cacheKey, {
          allPodcastItems,
          themeName: selectedTheme
        }, 300)
        
        setAllItems(allPodcastItems)
        setTheme(selectedTheme)
        
        // Show first 3 items from the selected theme
        const initialItems = allPodcastItems.slice(0, 3)
        setItems(initialItems)
        setCurrentIndex(0)
        setHasMore(allPodcastItems.length > 3)
        
        // Load OG images for visible items only
        if (mounted) {
          initialItems.forEach((item: Resource) => {
            if (item?.linkToOriginalSource) {
              fetchImage(item)
            }
          })
        }
      } catch (error) {
        console.error('Failed to fetch themes:', error)
      }
    }
    
    load()
    return () => { mounted = false }
  }, [startIndex, fetchImage])


  // Create intersection observer for loading images when cards become visible
  const createImageObserver = useCallback(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardElement = entry.target as HTMLElement
            const cardId = cardElement.dataset.cardId
            const item = items.find(i => (i.id || i.title) === cardId)
            
            if (item && !item.image) {
              console.log(`[PodcastCards] Card visible, loading OG image for: ${item.title}`)
              fetchImage(item)
            }
            observer.unobserve(entry.target)
          }
        })
      },
      { 
        threshold: 0.1, // Load when 10% visible
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    )
    return observer
  }, [items, fetchImage])

  // Setup observer when items are ready
  useEffect(() => {
    if (items.length > 0) {
      const observer = createImageObserver()

      // Observe card elements after they're rendered
      const timeoutId = setTimeout(() => {
        const cardElements = document.querySelectorAll('[data-card-id]')
        cardElements.forEach(el => observer.observe(el))
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        observer.disconnect()
      }
    }
  }, [items, createImageObserver])

  const handleNext = () => {
    const nextIndex = currentIndex + 3
    const nextItems = allItems.slice(nextIndex, nextIndex + 3)
    
    if (nextItems.length > 0) {
      setItems(nextItems)
      setCurrentIndex(nextIndex)
      setHasMore(allItems.length > nextIndex + 3)
      
      // Load OG images for newly visible items
      nextItems.forEach((item: Resource) => {
        if (item?.linkToOriginalSource) {
          fetchImage(item)
        }
      })
    } else {
      setHasMore(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = Math.max(0, currentIndex - 3)
      const prevItems = allItems.slice(prevIndex, prevIndex + 3)
      
      setItems(prevItems)
      setCurrentIndex(prevIndex)
      setHasMore(allItems.length > prevIndex + 3)
      
      // Load OG images for newly visible items
      prevItems.forEach((item: Resource) => {
        if (item?.linkToOriginalSource) {
          fetchImage(item)
        }
      })
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-11/12 md:w-10/12 flex flex-col items-center justify-center space-y-6">
        <div className="flex items-center justify-between text-muted-foreground w-full">
          <h3 className="font-medium text-lg">{theme || 'Podcast Resources'}</h3>
          <div className="flex items-center gap-2">
            {currentIndex > 0 && (
              <Button 
                onClick={handlePrevious}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 hover:bg-brand-secondary-50 border-brand-secondary-200"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
            )}
            {hasMore && (
              <Button 
                onClick={handleNext}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 hover:bg-brand-secondary-50 border-brand-secondary-200"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-4 md:gap-6 min-h-[24rem] md:min-h-[32rem]">
          {items.map((card, index) => (
          <Link key={card.id || index} href={`/resource/${card.id || encodeURIComponent(card.title)}`} className="block">
            <Card className="border-0 shadow-none p-0 h-[24rem] md:h-[32rem] w-full">
              <CardContent className="p-0 relative group overflow-hidden h-full w-full">
                <div className="h-[20rem] md:h-[28rem] w-full overflow-hidden rounded-xl">
                  {card?.image ? (
                    <Image 
                      src={card.image} 
                      alt="Featured" 
                      width={400} 
                      height={400} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/Rules1.png";
                      }}
                    />
                  ) : (
                    <Image src="/Rules1.png" alt="Default" width={400} height={400} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="absolute w-full h-full bg-gradient-to-b from-zinc-700/10 to-zinc-900/60 left-0 top-0 justify-between py-4 items-center flex flex-col transition-all duration-200 rounded-xl">
                  <div className="w-11/12 flex justify-between h-fit opacity-100 md:group-hover:opacity-100 md:opacity-0 transition-opacity">
                    <Badge variant="secondary" className="px-2 py-1 md:px-2.5 md:py-1.5 space-x-px h-fit text-xs md:text-sm">
                      <FileText className="size-3 md:size-3.5" strokeWidth={1.5} />
                      <span>{card?.type || 'Report'}</span>
                    </Badge>
                    <div className="flex flex-col items-center gap-3">
                      <Button className="rounded-full bg-primary/50 backdrop-blur-xs text-white border-none" variant="outline" size="icon" >
                        <Send className="size-3 md:size-4" strokeWidth={1.5} />
                      </Button>
                      <Button className="rounded-full bg-primary/50 backdrop-blur-xs text-white border-none" variant="outline" size="icon" >
                        <Bookmark className="size-3 md:size-4" strokeWidth={1.5} />
                      </Button>
                      <Button className="rounded-full bg-primary/50 backdrop-blur-xs text-white border-none" variant="outline" size="icon" >
                        <Pencil className="size-3 md:size-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                  <div className="w-11/12 flex flex-col items-start gap-1 md:gap-2">
                    <p className="text-white/80 text-xs md:text-sm leading-4 md:leading-5 line-clamp-2">{card?.summary}</p>
                    <Label 
                      className="text-white/80 uppercase cursor-pointer hover:text-white transition-colors" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const displayTag = card?.tags?.[0] || card?.theme;
                        if (displayTag) {
                          router.push(`/topics?theme=${encodeURIComponent(displayTag)}`);
                        }
                      }}
                    >
                      {card?.tags?.[0] || card?.theme || 'Theme'}
                    </Label>
                    <h3 className="text-white font-medium text-base md:text-lg leading-5 md:leading-6 line-clamp-2">{card?.title}</h3>
                    <div className="flex items-center gap-2">
                      <Avatar className="rounded-full size-6">
                        <AvatarImage
                          src="https://github.com/evilrabbit.jpg"
                          alt="author"
                        />
                        <AvatarFallback className="text-xs">{(card?.authors || 'A').slice(0,1)}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <h4>{card?.source || 'Source'}</h4>
                        <Sparkle className="size-3 text-muted" strokeWidth={1.5} fill="" />
                        <p>{card?.date || '23 Aug 2025'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start p-0 space-y-3">

              </CardFooter>
            </Card>
          </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PodcastCards