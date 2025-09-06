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

const PodcastCards = () => {
  const [items, setItems] = useState<Resource[]>([])

  useEffect(() => {
    let mounted = true
    
    // Use dashboard API to get theme-based resources
    fetch('/api/dashboard?limitPerTheme=1')
      .then(res => res.json())
      .then(data => {
        if (!mounted) return
        
        const themes = data?.themes || []
        // Get one resource from each of the first 3 themes
        const selectedResources = themes.slice(0, 3).map((themeData: { theme: string; resources: Resource[] }) => {
          const resource = themeData.resources[0] // Get first resource from each theme
          return resource ? {
            ...resource,
            themeCategory: themeData.theme
          } : null
        }).filter(Boolean) // Remove null entries
        
        // Set all items at once from theme-based content
        setItems(selectedResources.slice(0, 3).map((item: Resource, index: number) => ({
          ...item,
          image: item.image || (index === 0 ? '/Podcast1.png' : index === 1 ? '/Rules1.png' : '/Podcast2.jpg'),
          title: item.title || `Theme Resource ${index + 1}`,
          theme: item.theme || item.themeCategory || 'General',
          type: item.type || 'Report',
          source: item.source || 'Unknown Source',
          date: item.date || new Date().toLocaleDateString()
        })))
      })
      .catch(() => {
        // Fallback to empty array if API fails
        setItems([])
      })
       
    return () => { mounted = false }
  }, [])

  // Use all items directly without individual assignments
  const [card1, card2, card3] = items
  return (
    <div className="flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-3 w-full md:w-11/12 gap-6 min-h-[32rem]">
        <Link href="/topics" className="block">
          <Card className="border-0 shadow-none p-0 h-[32rem] w-full">
            <CardContent className="p-0 relative group overflow-hidden h-full w-full">
            <div className="h-[28rem] w-full overflow-hidden rounded-xl">
            <Image src={card1?.image || "/Podcast1.png"} alt="Featured" width={400} height={400} className="w-full h-full object-cover" />
            </div>
            <div className="absolute w-full h-full bg-gradient-to-b from-zinc-700/10 to-zinc-900/60 left-0 top-0 justify-between py-4 items-center flex flex-col transition-all duration-200 rounded-xl">
              <div className="w-11/12 flex justify-between h-fit md:group-hover:opacity-100 md:opacity-0 transition-opacity">
                <Badge variant="secondary" className="px-2.5 py-1.5 space-x-px h-fit">
                  <FileText className="size-3.5" strokeWidth={1.5} />
                  <span>{card1?.type || 'Report'}</span>
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
              <div className="w-11/12 flex flex-col justify-between h-fit space-y-3">
                <Label className="text-muted uppercase text-sm">{card1?.theme || 'Overcrowding'}</Label>
                <h2 className="text-base font-semibold text-white">{card1?.title || 'Prison Conditions in Maharashtra: A Comprehensive Study'}</h2>
                <div className="flex items-center gap-2">
                  <Avatar className="rounded-full size-5">
                    <AvatarImage
                      src="https://github.com/evilrabbit.jpg"
                      alt="@evilrabbit"
                    />
                    <AvatarFallback className="text-xs">H</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <h4>{card1?.source || 'Human Rights Comission'}</h4>
                    <Sparkle className="size-3 text-muted" strokeWidth={1.5} fill="" />
                    <p>{card1?.date || '23 Aug 2025'}</p>
                  </div>
                </div>
              </div>
            </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start p-0 space-y-3">

            </CardFooter>
          </Card>
        </Link>
        <Link href="/topics" className="block">
          <Card className="border-0 shadow-none p-0 h-[32rem] w-full">
            <CardContent className="p-0 relative group overflow-hidden h-full w-full">
            <div className="h-[28rem] w-full overflow-hidden rounded-xl">
            <Image src={card2?.image || "/Rules1.png"} alt="Featured" width={400} height={400} className="w-full h-full object-cover" />
            </div>
            <div className="absolute w-full h-full bg-gradient-to-b from-zinc-700/10 to-zinc-900/60 left-0 top-0 justify-between py-4 items-center flex flex-col transition-all duration-200 rounded-xl">
              <div className="w-11/12 flex justify-between h-fit md:group-hover:opacity-100 md:opacity-0 transition-opacity">
                <Badge variant="secondary" className="px-2.5 py-1.5 space-x-px h-fit">
                  <FileText className="size-3.5" strokeWidth={1.5} />
                  <span>{card2?.type || 'Report'}</span>
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
              <div className="w-11/12 flex flex-col justify-between h-fit space-y-3">
                <Label className="text-muted uppercase text-sm">{card2?.theme || 'Overcrowding'}</Label>
                <h2 className="text-base font-semibold text-white">{card2?.title || 'Prison Conditions in Maharashtra: A Comprehensive Study'}</h2>
                <div className="flex items-center gap-2">
                  <Avatar className="rounded-full size-5">
                    <AvatarImage
                      src="https://github.com/evilrabbit.jpg"
                      alt="@evilrabbit"
                    />
                    <AvatarFallback className="text-xs">H</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <h4>{card2?.source || 'Human Rights Comission'}</h4>
                    <Sparkle className="size-3 text-muted" strokeWidth={1.5} fill="" />
                    <p>{card2?.date || '23 Aug 2025'}</p>
                  </div>
                </div>
              </div>
            </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start p-0 space-y-3">

            </CardFooter>
          </Card>
        </Link>
        <Link href="/topics" className="block">
          <Card className="border-0 shadow-none p-0 h-[32rem] w-full">
            <CardContent className="p-0 relative group overflow-hidden h-full w-full">
            <div className="h-[28rem] w-full overflow-hidden rounded-xl">
            <Image src={card3?.image || "/Podcast2.jpg"} alt="Featured" width={400} height={400} className="w-full h-full object-cover" />
            </div>
            <div className="absolute w-full h-full bg-gradient-to-b from-zinc-700/10 to-zinc-900/60 left-0 top-0 justify-between py-4 items-center flex flex-col transition-all duration-200 rounded-xl">
              <div className="w-11/12 flex justify-between h-fit md:group-hover:opacity-100 md:opacity-0 transition-opacity">
                <Badge variant="secondary" className="px-2.5 py-1.5 space-x-px h-fit">
                  <FileText className="size-3.5" strokeWidth={1.5} />
                  <span>{card3?.type || 'Report'}</span>
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
              <div className="w-11/12 flex flex-col justify-between h-fit space-y-3">
                <Label className="text-muted uppercase text-sm">{card3?.theme || 'Overcrowding'}</Label>
                <h2 className="text-base font-semibold text-white">{card3?.title || 'Prison Conditions in Maharashtra: A Comprehensive Study'}</h2>
                <div className="flex items-center gap-2">
                  <Avatar className="rounded-full size-5">
                    <AvatarImage
                      src="https://github.com/evilrabbit.jpg"
                      alt="@evilrabbit"
                    />
                    <AvatarFallback className="text-xs">H</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <h4>{card3?.source || 'Human Rights Comission'}</h4>
                    <Sparkle className="size-3 text-muted" strokeWidth={1.5} fill="" />
                    <p>{card3?.date || '23 Aug 2025'}</p>
                  </div>
                </div>
              </div>
            </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start p-0 space-y-3">

            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export default PodcastCards