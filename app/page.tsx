"use client"
import AllThemeSections from "@/components/AllThemeSections";
import Featured from "@/components/Featured";
import MoreTopics from "@/components/MoreTopics";
import ShareCard from "@/components/ShareCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { Instrument_Serif } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { pageCache } from "@/lib/cache";

const instrument_serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"]
})

export default function Home() {

  const [searchQuery, setSearchQuery] = useState("")
  const [trendingTags, setTrendingTags] = useState<{ name: string; count: number }[]>([])
  const router = useRouter()

  const handleSearch = () => {
    if (!searchQuery) {
      toast.error("Please enter a query")
    }
    router.push(`/search?query=${searchQuery}`)
  }

  useEffect(() => {
    let mounted = true

    async function loadTrendingTags() {
      try {
        // Check cache first
        const cacheKey = 'trending-tags-home'
        const cachedData = pageCache.get(cacheKey) as { name: string; count: number }[] | null

        if (cachedData && mounted) {
          console.log('[Home] Using cached trending tags')
          setTrendingTags(cachedData)
          return
        }

        // Fetch trending keywords/tags and deduplicate by name
        const response = await fetch('/api/tags')
        const json = await response.json()

        if (!mounted) return

        const list: { name: string; count: number }[] = Array.isArray(json.data) ? json.data : []
        const map = new Map<string, { name: string; count: number }>()
        for (const t of list) {
          const key = (t.name || '').toLowerCase()
          if (!map.has(key)) map.set(key, t)
        }
        const dedupedTags = Array.from(map.values())

        // Cache for 10 minutes (600 seconds)
        pageCache.set(cacheKey, dedupedTags, 600)

        setTrendingTags(dedupedTags)
      } catch (error) {
        console.error('[Home] Failed to load trending tags:', error)
      }
    }

    loadTrendingTags()
    return () => { mounted = false }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full pb-20 gap-16">
      <div className="min-h-[70svh] md:min-h-[50vh] flex w-11/12 md:w-10/12 flex-col gap-10 justify-end">
        {/* Main heading with icon */}
        <div className="max-w-xl flex flex-col gap-6">
          <h1 className={`${instrument_serif.className} text-5xl md:text-6xl font-light text-brand-primary-900 mb-4`}>
            Your platform for
            <br />
            prison reform & research{" "}
            <Lightbulb className="inline-block w-12 h-12 text-brand-secondary-600 ml-2" />
          </h1>
          <div className="border flex items-center justify-between p-1 md:p-2 rounded-full">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="border-none shadow-none focus-visible:ring-0 text-sm md:text-xl" placeholder="Search by topics"
            />
            <button onClick={handleSearch} className="p-2 bg-brand-secondary-600 rounded-full hover:bg-brand-secondary-600/90 transition-colors" aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.65 16.65M11 6C13.7614 6 16 8.23858 16 11M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

            </button>
          </div>
        </div>
        {/* Trending keywords only */}
        <div className="flex flex-col md:flex-row md:items-center gap-3.5">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-medium">🔥 Trending:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {trendingTags.slice(0,12).map((t) => (
              <Badge
                key={t.name}
                variant="secondary"
                className="px-3 py-1 rounded-full cursor-pointer"
                onClick={() => router.push(`/topics?theme=${encodeURIComponent(t.name)}`)}
              >
                {`${(t.name || '').charAt(0).toUpperCase()}${(t.name || '').slice(1)}`}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Companies Section */}
      <section className="w-full bg-gray-50/50 py-4 border-t border-b border-gray-100">
        <div className="w-11/12 md:w-10/12 mx-auto">
          <div className="flex items-center justify-center gap-12 md:gap-16 lg:gap-20 flex-wrap">
            {/* The Guardian */}
            <div className="flex items-center justify-center h-12 text-gray-500 hover:text-gray-700 transition-all duration-300 transform hover:scale-105">
              <svg viewBox="0 0 200 40" className="h-8 md:h-10 fill-current">
                <text x="0" y="28" className="text-2xl md:text-3xl font-serif font-medium">The Guardian</text>
              </svg>
            </div>

            {/* Bloomberg */}
            <div className="flex items-center justify-center h-12 text-gray-500 hover:text-gray-700 transition-all duration-300 transform hover:scale-105">
              <svg viewBox="0 0 160 40" className="h-8 md:h-10 fill-current">
                <text x="0" y="28" className="text-2xl md:text-3xl font-sans font-semibold tracking-tight">Bloomberg</text>
              </svg>
            </div>

            {/* Quotient */}
            <div className="flex items-center justify-center h-12 text-gray-500 hover:text-gray-700 transition-all duration-300 transform hover:scale-105">
              <svg viewBox="0 0 160 40" className="h-8 md:h-10 fill-current">
                <text x="0" y="28" className="text-2xl md:text-3xl font-sans font-medium">Quotient</text>
              </svg>
            </div>

            {/* Forbes */}
            <div className="flex items-center justify-center h-12 text-gray-500 hover:text-gray-700 transition-all duration-300 transform hover:scale-105">
              <svg viewBox="0 0 160 40" className="h-8 md:h-10 fill-current">
                <text x="0" y="28" className="text-2xl md:text-3xl font-serif font-bold tracking-wide">FORBES</text>
              </svg>
            </div>

            {/* Gizmodo */}
            <div className="flex items-center justify-center h-12 text-gray-500 hover:text-gray-700 transition-all duration-300 transform hover:scale-105">
              <svg viewBox="0 0 160 40" className="h-8 md:h-10 fill-current">
                <text x="0" y="28" className="text-2xl md:text-3xl font-sans font-bold tracking-wider">GIZMODO</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <Featured />
      <AllThemeSections />
      <ShareCard />
      <MoreTopics />
    </div>
  );
}
