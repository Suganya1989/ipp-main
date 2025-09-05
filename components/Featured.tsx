"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bookmark, BookOpen, Pencil, Send, Sparkle, Sparkles, Zap } from "lucide-react";
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

const Featured = () => {
  const [items, setItems] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch(`/api/featured?limit=4`).then(r => r.json()).then((j) => {
      if (!mounted) return
      setItems(j.data || [])
    }).catch(() => {
      // no-op
    }).finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  const featured = items[0]
  const trending = items.slice(1, 4)

  return (
    <section className="flex flex-col md:flex-row gap-6 md:gap-0 w-11/12 md:w-10/12 justify-between h-fit">
      <div className="w-full md:w-[45%] space-y-6">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Sparkles className="size-4" strokeWidth={1.5} />
          <h3>Featured</h3>
        </div>
        <Card className="border-0 shadow-none p-0">
          <CardContent className="p-0 relative group">
            {featured?.image ? (
              <Image src={featured.image} alt="Featured" width={400} height={400} className="w-full rounded-xl h-[320px] object-cover" />
            ) : (
              <div className="w-full rounded-xl h-[320px] bg-muted" />
            )}
            <div className="absolute w-full h-full left-0 top-0  justify-center py-6 md:group-hover:opacity-100 md:opacity-0 flex  transition-all duration-200">
              <div className="w-11/12 flex justify-between h-fit">
                <Badge variant="secondary" className="px-2.5 py-1.5 space-x-px h-fit">
                  <BookOpen className="size-3.5" strokeWidth={1.5} />
                  <span>{featured?.type || 'Article'}</span>
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
            <Label className="text-muted-foreground uppercase">{featured?.theme || 'Theme'}</Label>
            <h2 className="text-lg md:text-2xl font-semibold text-brand-primary-900">{featured?.title || 'Featured resource'}</h2>
            <div className="flex items-center gap-2">
              <Avatar className="rounded-full size-6">
                <AvatarImage
                  src="https://github.com/evilrabbit.jpg"
                  alt="author"
                />
                <AvatarFallback className="text-xs">{(featured?.authors || 'A').slice(0,1)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-sm">
                <h4>{featured?.source || 'Source'}</h4>
                <Sparkle className="size-3 text-muted" strokeWidth={1.5} fill="" />
                <p>{featured?.date || ''}</p>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="h-px md:h-[550px] w-full md:w-px bg-border" />
      <div className="w-full md:w-[45%] space-y-6">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Zap className="size-4" strokeWidth={1.5} />
          <h3>Trending</h3>
        </div>
        <div className="flex flex-col gap-6">
          {loading && (
            <>
              {[0,1,2].map((i) => (
                <div key={`sk-tr-${i}`} className="flex items-center gap-3 md:gap-8 h-28 md:h-32">
                  <div className="w-1/3 h-full">
                    <div className="w-full h-full rounded-md bg-muted animate-pulse" />
                  </div>
                  <div className="space-y-2 w-3/5">
                    <div className="h-5 w-11/12 bg-muted rounded animate-pulse" />
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          {!loading && trending.map((t) => (
            <div key={t.id} className="flex items-center gap-3 md:gap-8 h-28 md:h-32">
              <div className="w-1/3 h-full">
                {t.image ? (
                  <Image src={t.image} alt="Featured" width={400} height={400} className="w-full h-full rounded-md object-cover" />
                ) : (
                  <div className="w-full h-full rounded-md bg-muted" />
                )}
              </div>
              <div className="space-y-2 w-3/5">
                <h3 className="text-base md:text-lg font-semibold text-brand-primary-900 line-clamp-2">{t.title}</h3>
                <div className="flex items-center gap-2">
                  <Avatar className="rounded-full size-6">
                    <AvatarImage
                      src="https://github.com/evilrabbit.jpg"
                      alt="author"
                    />
                    <AvatarFallback className="text-xs bg-rose-100 text-rose-400 font-medium">{(t.authors || 'A').slice(0,1)}</AvatarFallback>
                  </Avatar>
                  <h4 className="text-sm text-muted-foreground">{t.source || 'Source'}</h4>
                </div>
              </div>
            </div>
          ))}
          {trending.length === 0 && !loading && (
            <div className="text-sm text-muted-foreground">No trending items.</div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Featured