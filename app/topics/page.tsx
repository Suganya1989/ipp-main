'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Bookmark, FileText, Pencil, Send } from 'lucide-react'
import { formatDateDMY } from '@/lib/utils'

import { Instrument_Serif } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

const instrument_serif = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"]
})

const topicTitles = [
    "All Topics",
    "Standards",
    "Economy",
    "Overcrowding",
    "Disparities",
    "Reintegration",
    "Health",
    "Innovation",
    "Justice",
    "Rights",
    "Technology",
    "Stories",
    "Case Laws",
    "Comparative",
    "Philosophy"
]

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
    authors?: string;
    linkToOriginalSource?: string;
}

const TopicsPageContent = () => {
    const searchParams = useSearchParams()
    const theme = searchParams.get('theme')
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedTheme, setSelectedTheme] = useState<string>(theme || 'All Topics')

    useEffect(() => {
        if (theme) {
            setSelectedTheme(theme)
            fetchResourcesByTheme(theme)
        }
    }, [theme])

    const fetchResourcesByTheme = async (themeName: string) => {
        if (themeName === 'All Topics') return
        
        setLoading(true)
        try {
            const response = await fetch(`/ap~i/search?themes=${encodeURIComponent(themeName)}&limit=15`)
            const data = await response.json()
            const resourcesData = Array.isArray(data.data) ? data.data : []
            
            // Set initial resources without default images
            type UnknownResource = Resource & { ['date of publication']?: string }
            const initialResources = (resourcesData as UnknownResource[]).map((item) => ({
                ...item,
                DateOfPublication: item.dateOfPublication  || item.date,
                image: item.image || undefined // Don't set default image initially
            }))
            
            setResources(initialResources)
            setLoading(false) // Complete loading immediately after setting resources
            
            // Fetch OG images in the background without blocking
            setTimeout(() => {
                initialResources.forEach((item: Resource) => {
                    if (item.linkToOriginalSource && item.linkToOriginalSource.startsWith('http')) {
                        // Use requestIdleCallback for better performance if available
                        const fetchOGImage = () => {
                            fetch('/api/og-image-async', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    resourceId: item.id || `resource-${Date.now()}`,
                                    url: item.linkToOriginalSource
                                })
                            })
                            .then(response => {
                                console.log('OG Image API Response Status:', response.status)
                                if (!response.ok) {
                                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                                }
                                return response.json()
                            })
                            .then(ogData => {
                                console.log('OG Image fetched for:', item.title, ogData)
                                if (ogData.ogImage) {
                                    // Update the specific resource with the OG image
                                    setResources(prev => prev.map(resource => 
                                        resource.id === item.id 
                                            ? { ...resource, image: ogData.ogImage }
                                            : resource
                                    ))
                                } else {
                                    // If no OG image found, keep image undefined (blank)
                                    setResources(prev => prev.map(resource => 
                                        resource.id === item.id 
                                            ? { ...resource, image: undefined }
                                            : resource
                                    ))
                                }
                            })
                            .catch((error) => {
                                console.error('Error fetching OG image for:', item.title, error)
                                // Keep image blank on error
                                setResources(prev => prev.map(resource => 
                                    resource.id === item.id 
                                        ? { ...resource, image: undefined }
                                        : resource
                                ))
                            })
                        }
                        
                        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                            window.requestIdleCallback(fetchOGImage)
                        } else {
                            setTimeout(fetchOGImage, 100)
                        }
                    } else {
                        // If no linkToOriginalSource, keep image blank
                        setResources(prev => prev.map(resource => 
                            resource.id === item.id 
                                ? { ...resource, image: undefined }
                                : resource
                        ))
                    }
                })
            }, 0)
        } catch (error) {
            console.error('Error fetching resources:', error)
            setResources([])
            setLoading(false)
        }
    }

    const handleThemeClick = (themeName: string) => {
        setSelectedTheme(themeName)
        if (themeName === 'All Topics') {
            setResources([])
        } else {
            fetchResourcesByTheme(themeName)
        }
    }

    return (
        <div className='flex flex-col items-center justify-center py-12'>
            <div className='w-11/12 md:w-10/12 space-y-8'>
                <div className="min-h-[70svh] md:min-h-[50vh] flex flex-col gap-10 justify-center items-center">
                    {/* Main heading with icon */}
                    <div className="max-w-2xl flex flex-col items-center gap-6">
                        <h1 className={`${instrument_serif.className} text-5xl md:text-6xl font-light text-brand-primary-900 mb-4 text-center`}>
                            Your platform for
                            <br />
                            prison reform & research{" "}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-3">
                            {topicTitles.map((title) => (
                                <Button 
                                    key={title} 
                                    variant={selectedTheme === title ? "default" : "outline"} 
                                    size="sm" 
                                    className="rounded-full px-4 text-brand-primary-900 shadow-none"
                                    onClick={() => handleThemeClick(title)}
                                >
                                    {title}
                                </Button>
                            ))}
                        </div>
                    </div>
                    {/* Trending section */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3.5">


                    </div>
                </div>
                <Separator />
                {selectedTheme !== 'All Topics' && (
                    <div className='space-y-6'>
                        <div className='flex items-center gap-1'>
                            <Label className='text-lg font-semibold text-brand-primary-900'>{selectedTheme}</Label>
                            <Badge className='bg-brand-secondary-200 text-primary rounded-full'>{resources.length} Resources</Badge>
                        </div>
                        {loading ? (
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                                {[...Array(6)].map((_, idx) => (
                                    <Card key={idx} className="border-0 shadow-none p-0 h-96">
                                        <CardContent className="p-0 rounded-xl group overflow-hidden h-full bg-muted flex flex-col items-center animate-pulse">
                                            <div className='relative h-3/5 w-full bg-gray-300 rounded-t-xl'></div>
                                            <div className="w-[95%] flex flex-col justify-evenly h-2/5 space-y-3 p-2">
                                                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                                                <div className="h-6 bg-gray-300 rounded w-full"></div>
                                                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                                {resources.map((resource, idx) => {
                                    if (idx % 2 !== 0) {
                                        return (
                                            <Link key={resource.id || idx} href={`/resource/${resource.id || encodeURIComponent(resource.title)}`}>
                                                <Card className="border-0 shadow-none p-0">
                                                <CardContent className="p-0 relative group overflow-hidden">
                                                    <Image 
                                                        src={resource.image || "/Rules1.png"} 
                                                        alt="Featured" 
                                                        width={400} 
                                                        height={400} 
                                                        className="w-full h-96 object-cover rounded-xl"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/Rules1.png";
                                                        }}
                                                    />
                                            <div className="absolute w-full h-full bg-gradient-to-b from-zinc-700/10 to-zinc-900/60 left-0 top-0 justify-between py-4 items-center flex flex-col transition-all duration-200 rounded-xl">
                                                <div className="w-11/12 flex justify-between h-fit md:group-hover:opacity-100 md:opacity-0 transition-opacity">
                                                    <Badge variant="secondary" className="px-2.5 py-1.5 space-x-px h-fit">
                                                        <FileText className="size-3.5" strokeWidth={1.5} />
                                                        <span>Report</span>
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
                                                    <Label className="text-muted uppercase text-sm">{resource.theme || 'Theme'}</Label>
                                                    <h2 className="text-base font-semibold text-white">{resource.title}</h2>
                                                    <div className="flex items-center gap-1.5 text-xs text-white">
                                                        <h4>{resource.source || 'Source'}</h4>
                                                        <span aria-hidden className="text-white/80">•</span>
                                                        <p>{formatDateDMY(resource.dateOfPublication || resource.date)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex flex-col items-start p-0 space-y-3">

                                        </CardFooter>
                                    </Card>
                                </Link>
                                )
                            } else {
                                return (
                                    <Link key={resource.id || idx} href={`/resource/${resource.id || encodeURIComponent(resource.title)}`}>
                                        <Card className="border-0 shadow-none p-0 h-96">
                                        <CardContent className="p-0 rounded-xl group overflow-hidden h-full bg-muted flex flex-col items-center">
                                            <div className='relative h-3/5 w-full'>
                                                <Image 
                                                    src={resource.image || "/Rules1.png"} 
                                                    alt="Featured" 
                                                    width={400} 
                                                    height={400} 
                                                    className="w-full object-cover rounded-t-xl h-full"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "/Rules1.png";
                                                    }}
                                                />
                                                <div className="absolute w-full h-full bg-gradient-to-b from-zinc-700/10 to-zinc-900/10 left-0 top-0 justify-between py-4 items-center flex flex-col transition-all duration-200 rounded-t-xl">
                                                    <div className="w-11/12 flex justify-between h-fit md:group-hover:opacity-100 md:opacity-0 transition-opacity">
                                                        <Badge variant="secondary" className="px-2.5 py-1.5 space-x-px h-fit">
                                                            <FileText className="size-3.5" strokeWidth={1.5} />
                                                            <span>Report</span>
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
                                            </div>
                                            <div className="w-[95%] flex flex-col justify-evenly h-2/5 space-y-3 p-2">
                                                <Label className="text-muted-foreground uppercase text-sm">{resource.theme || 'Theme'}</Label>
                                                <h2 className="text-base font-semibold">{resource.title}</h2>
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <h4>{resource.source || 'Source'}</h4>
                                                    <span aria-hidden className="text-muted-foreground">•</span>
                                                    <p>{formatDateDMY(resource.dateOfPublication || resource.date)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    </Link>
                                )
                            }
                        })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const TopicsPage = () => {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <TopicsPageContent />
        </Suspense>
    )
}

export default TopicsPage