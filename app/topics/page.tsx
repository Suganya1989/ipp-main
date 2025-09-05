import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { topics } from '@/lib/data'
import { Bookmark, FileText, Pencil, Send, Sparkle } from 'lucide-react'
import { Instrument_Serif } from 'next/font/google'
import Image from 'next/image'

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

const TopicsPage = () => {
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
                                <Button key={title} variant="outline" size="sm" className="rounded-full px-4 text-brand-primary-900 shadow-none">
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
                <div className='space-y-6'>
                    <div className='flex items-center gap-1'>
                        <Label className='text-lg font-semibold text-brand-primary-900'>Prison Economy, Infrastructure, and Administration</Label>
                        <Badge className='bg-brand-secondary-200 text-primary rounded-full'>22 Blogs</Badge>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        {topics.map((topic, idx) => {
                            if (idx % 2 !== 0) {
                                return (
                                    <Card key={topic.id} className="border-0 shadow-none p-0">
                                        <CardContent className="p-0 relative group overflow-hidden">
                                            <Image src={topic.imageUrl} alt="Featured" width={400} height={400} className="w-full h-96 object-cover rounded-xl" />
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
                                                    <Label className="text-muted uppercase text-sm">Overcrowding</Label>
                                                    <h2 className="text-base font-semibold text-white">Prison Conditions in Maharashtra: A Comprehensive Study</h2>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="rounded-full size-5">
                                                            <AvatarImage
                                                                src="https://github.com/evilrabbit.jpg"
                                                                alt="@evilrabbit"
                                                            />
                                                            <AvatarFallback className="text-xs bg-amber-100 text-amber-600 font-medium">H</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex items-center gap-2 text-xs text-white">
                                                            <h4>Human Rights Comission</h4>
                                                            <Sparkle className="size-3 text-muted" strokeWidth={1.5} fill="" />
                                                            <p>23 Aug 2025</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex flex-col items-start p-0 space-y-3">

                                        </CardFooter>
                                    </Card>
                                )
                            } else {
                                return (
                                    <Card key={topic.id} className="border-0 shadow-none p-0 h-96">
                                        <CardContent className="p-0 rounded-xl group overflow-hidden h-full bg-muted flex flex-col items-center">
                                            <div className='relative h-3/5 w-full'>
                                                <Image src={topic.imageUrl} alt="Featured" width={400} height={400} className="w-full object-cover rounded-t-xl h-full" />
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
                                                <Label className="text-muted-foreground uppercase text-sm">Overcrowding</Label>
                                                <h2 className="text-base font-semibold">Prison Conditions in Maharashtra: A Comprehensive Study</h2>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="rounded-full size-6">
                                                        <AvatarImage
                                                            src="https://github.com/evilrabbit.jpg"
                                                            alt="@evilrabbit"
                                                        />
                                                        <AvatarFallback className="text-xs bg-rose-100 text-rose-500 font-medium">P</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <h4>Human Rights Comission</h4>
                                                        <Sparkle className="size-3 text-muted-foreground" strokeWidth={1.5} fill="" />
                                                        <p>23 Aug 2025</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            }
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TopicsPage