import { LinkIcon } from 'lucide-react'
import { Instrument_Serif } from 'next/font/google'
import { Button } from './ui/button'
import { Input } from './ui/input'

const instrument_serif = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"]
})

const ShareCard = () => {
    return (
        <div className="w-full flex items-center justify-center">
            <div className="w-11/12 md:w-10/12 bg-zinc-900 px-3 py-6 md:p-6 rounded-xl flex justify-center">
                <div className="flex flex-col gap-6 md:gap-0 md:flex-row items-center justify-between w-[95%] md:w-11/12">
                    {/* Left Content */}
                    <div className="flex-1 space-y-6 w-full">
                        <h1 className={`${instrument_serif.className} text-5xl md:text-5xl font-light text-white`}>
                            Share Insights. Spark<br />
                            Change. Support Justice
                        </h1>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 rounded-sm font-medium"
                            >
                                Contribute
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-md px-6"
                            >
                                Login
                            </Button>
                        </div>
                    </div>

                    {/* Right Content - Resource URL Section */}
                    <div className="flex-shrink-0 w-full md:w-80">
                        <div className="bg-zinc-800/80 rounded-xl p-3.5 space-y-4 min-h-52">
                            <div className='flex items-center gap-1 bg-zinc-700/50 px-4 py-1.5 rounded-lg'>
                                <LinkIcon className='size-4 text-white' strokeWidth={1.5} />
                                <Input
                                    placeholder="Resource URL"
                                    className="border-none shadow-none focus-visible:ring-0 placeholder:text-muted text-white"
                                />
                            </div>

                            <p className="text-slate-300 text-xs leading-relaxed">
                                Paste the URL of the article, report, or resource you want to share. We&apos;ll automatically extract the title, description, and image
                            </p>


                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShareCard