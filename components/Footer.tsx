import { Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui/button'
import { Input } from './ui/input'

const Footer = () => {
    return (
        <footer className="bg-gray-50 flex items-center justify-center py-10">
            <div className="w-11/12 md:w-10/12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Explore Section */}
                    <div className='space-y-6'>
                        <h3 className="font-semibold text-muted-foreground">EXPLORE</h3>
                        <ul className="gap-4 flex flex-col">
                            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
                            <Link href="/resources" className="text-gray-600 hover:text-gray-900 transition-colors">Resources</Link>
                            <Link href="/reports" className="text-gray-600 hover:text-gray-900 transition-colors">Reports</Link>
                            <Link href="/legal" className="text-gray-600 hover:text-gray-900 transition-colors">Legal</Link>
                            <Link href="/stories" className="text-gray-600 hover:text-gray-900 transition-colors">Stories</Link>
                        </ul>
                    </div>

                    {/* About Section */}
                    <div className='space-y-6'>
                        <h3 className="font-semibold text-muted-foreground">ABOUT</h3>
                        <ul className="gap-4 flex flex-col">
                            <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">About IPP</Link>
                            <Link href="/contribute" className="text-gray-600 hover:text-gray-900 transition-colors">Contribute</Link>
                            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
                            <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</Link>
                        </ul>
                    </div>

                    {/* Newsletter Section */}
                    <div className='space-y-4'>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Sign up for our newsletter to get regular updates
                        </h3>
                        <div className="space-y-4">
                            <div className="border flex items-center py-2 px-4 rounded-md">
                                <Mail className='size-4.5 text-muted-foreground' strokeWidth={1.5} />
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    className="border-none shadow-none focus-visible:ring-0"
                                />

                            </div>
                            <Button className='w-full h-11 bg-brand-primary-900'>
                                Join the newsletter
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-500 text-sm mb-4 md:mb-0">
                        © 2024 India Prison Portal. Open knowledge for prison reform.
                    </p>

                    {/* Social Icons */}
                    <div className="flex space-x-6">
                        <Link href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.375-.444.864-.608 1.25a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.25.077.077 0 0 0-.079-.036A19.876 19.876 0 0 0 3.677 4.492a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.082.082 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 14.23 14.23 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                            </svg>
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer