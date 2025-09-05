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
import { Bookmark, BookOpen, Pencil, Send, Sparkle } from "lucide-react";
import Image from "next/image";
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
}

const RulesAndFramework = () => {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<string>("")

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        // 1) Fetch themes sorted by count (trending)
        const themesRes = await fetch('/api/themes')
        const themesJson = await themesRes.json()
        const themes: { name: string; count: number }[] = Array.isArray(themesJson.data) ? themesJson.data : []
        // Pick the 3rd most trending theme (index 2), fallback to 2nd then 1st
        const nextTrending = themes[2]?.name || themes[1]?.name || themes[0]?.name || ''
        if (!mounted) return
        setTheme(nextTrending)

        if (nextTrending) {
          // 2) Fetch two resources for that theme using the search API with a theme filter
          const res = await fetch(`/api/search?themes=${encodeURIComponent(nextTrending)}&limit=2`)
          const json = await res.json()
          if (!mounted) return
          setResources(Array.isArray(json.data) ? json.data : [])
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
  }, [])

  const cards = resources.slice(0, 2)

  return (
    <div className="w-11/12 md:w-10/12 flex flex-col items-center justify-center space-y-6">
      <div className="flex items-center gap-1 text-muted-foreground w-full">
        <h3 className="font-medium text-lg">{theme || 'Rules, Standards, and International Frameworks'}</h3>
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
        {!loading && cards.map((item, idx) => (
          <div key={item.id || idx} className="w-full md:w-[45%] space-y-6">
            <Card className="border-0 shadow-none p-0">
              <CardContent className="p-0 relative group">
                {item.image ? (
                  <Image src={item.image} alt={item.title} width={400} height={400} className="w-full h-80 object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-80 rounded-xl bg-muted" />
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
                <Label className="text-muted-foreground uppercase">{item.theme || theme || 'Theme'}</Label>
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
          </div>
        ))}
      </section>

      {!loading && cards.length === 0 && (
        <div className="w-full text-sm text-muted-foreground">No resources found for the trending theme.</div>
      )}
    </div>
  )
}

export default RulesAndFramework