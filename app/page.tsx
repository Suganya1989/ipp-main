"use client"
import Featured from "@/components/Featured";
import MoreTopics from "@/components/MoreTopics";
import OverCrowding from "@/components/OverCrowding";
import PodcastCards from "@/components/PodcastCards";
import RulesAndFramework from "@/components/RulesAndFramework";
import ShareCard from "@/components/ShareCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb } from "lucide-react";
import { Instrument_Serif } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const instrument_serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"]
})

export default function Home() {

  const [searchQuery, setSearchQuery] = useState("")
  const [trending, setTrending] = useState<{ name: string; count: number; href?: string }[]>([])
  const router = useRouter()

  const handleSearch = () => {
    if (!searchQuery) {
      toast.error("Please enter a query")
    }
    router.push(`/search?query=${searchQuery}`)
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/categories')
      .then(r => r.json())
      .then(j => { if (mounted) setTrending(Array.isArray(j.data) ? j.data : []) })
      .catch(() => {})
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
            <button onClick={handleSearch} className="p-2 bg-brand-secondary-600 rounded-full hover:bg-brand-secondary-600/90 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.65 16.65M11 6C13.7614 6 16 8.23858 16 11M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

            </button>
          </div>
        </div>
        {/* Trending section */}
        <div className="flex flex-col md:flex-row md:items-center gap-3.5">
          <div className="flex items-center gap-2 text-gray-600">
            {/* <TrendingUp className="size-5 text-orange-500" strokeWidth={1.5} /> */}
            <span className="font-medium">🔥 Trending:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 md:gap-3">
            {trending.slice(0,4).map((t) => (
              <Button
                key={t.name}
                variant="outline"
                size="sm"
                className="rounded-full px-4 text-muted-foreground shadow-none"
                onClick={() => router.push(`/search?query=${encodeURIComponent(t.name)}`)}
              >
                {t.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <Featured />
      <RulesAndFramework />
      <PodcastCards startIndex={0} />
      <ShareCard />
      <OverCrowding />
      <PodcastCards startIndex={4} />
      <MoreTopics />
    </div>
  );
}
