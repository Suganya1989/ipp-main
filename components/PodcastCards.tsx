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
import { Bookmark, FileText, Pencil, Send, Sparkle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Resource = {
  id?: string;
  title: string;
  summary: string;
  type: string;
  source: string;
  date: string;
  image?: string;
  theme?: string;
  authors?: string;
  linkToOriginalSource?: string;
  themeCategory?: string;
}

interface PodcastCardsProps {
  startIndex?: number;
}

const PodcastCards = ({ startIndex = 0 }: PodcastCardsProps) => {
  const [items, setItems] = useState<Resource[]>([])

  useEffect(() => {
    let mounted = true
    
    // Use dashboard API to get theme-based resources
    fetch('/api/dashboard?limitPerTheme=1')
      .then(res => res.json())
      .then(async (data) => {
        if (!mounted) return
        
        const themes = data?.themes || []
        // Get one resource from each of the themes, starting from startIndex
        const selectedResources = themes.slice(startIndex, startIndex + 3).map((themeData: { theme: string; resources: Resource[] }) => {
          const resource = themeData.resources[0] // Get first resource from each theme
          return resource ? {
            ...resource,
            themeCategory: themeData.theme
          } : null
        }).filter(Boolean) // Remove null entries
        
        // Set initial items with fallback images for immediate display
        const initialItems = selectedResources.slice(0, 3).map((item: Resource, index: number) => ({
          ...item,
          image: item.image,
          title: item.title || `Theme Resource ${index + 1}`,
          theme: item.theme || item.themeCategory || 'General',
          type: item.type || 'Report',
          source: item.source || 'Unknown Source',
          date: item.date || new Date().toLocaleDateString()
        }))
        
        setItems(initialItems)
        
        // Asynchronously fetch OG images without blocking the UI
        initialItems.forEach((item: Resource) => {
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
              if (mounted && ogData.ogImage) {
                setItems(prevItems => 
                  prevItems.map(prevItem => 
                    prevItem.id === ogData.resourceId 
                      ? { ...prevItem, image: ogData.ogImage }
                      : prevItem
                  )
                )
              }
            })
            .catch(() => {
              // Silently fail - keep fallback image
            })
          }
        })
      })
      .catch(error => {
        console.error('Failed to fetch dashboard data:', error)
       
      })

    return () => {
      mounted = false
    }
  }, [startIndex])

  return (
    <div className="flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-3 w-11/12 md:w-10/12 gap-4 md:gap-6 min-h-[24rem] md:min-h-[32rem]">
        {items.slice(0, 3).map((card, index) => (
          <Link key={card?.id || index} href="/topics" className="block">
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
                    <p className="text-white/80 text-xs md:text-sm leading-4 md:leading-5 line-clamp-2">{card?.description}</p>
                    <Label className="text-white/80 uppercase">{card?.theme || 'Theme'}</Label>
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
  )
}

export default PodcastCards