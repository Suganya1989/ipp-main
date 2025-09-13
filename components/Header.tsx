"use client"

import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "./ui/button"


const menuVariants = {
    closed: { x: "100%", opacity: 0, transition: { duration: 0.3 } },
    open: { x: 0, opacity: 1, transition: { duration: 0.3 } },
}

const Header = () => {
    const [isMenuOpen, setMenuOpen] = useState(false)

    return (
        <header className="flex items-center justify-center h-16 sticky top-0 bg-background z-40">
            <div className="flex items-center justify-between w-11/12 md:w-10/12 ">
                {/* Logo */}
                <Link href="/" className="inline-block">
                    <Image
                        src={"/IPP Logo.png"}
                        width={200}
                        height={200}
                        alt="Logo"
                        className="w-24 md:w-28 cursor-pointer"
                    />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-10 text-muted-foreground">
                    <Link className="hover:text-brand-primary-900" href={"/topics"}>Topics</Link>
                    <Link className="hover:text-brand-primary-900" href={"/"}>Features</Link>
                    <Link className="hover:text-brand-primary-900" href={"/"}>Stories & Voices</Link>
                    <Link className="hover:text-brand-primary-900" href={"/"}>Opportunities & Events</Link>
                    <Link className="hover:text-brand-primary-900" href={"/"}>Resources</Link>
                    <Link className="hover:text-brand-primary-900" href={"/"}>Data</Link>
                    <Link className="hover:text-brand-primary-900" href={"/"}>About</Link>
                </nav>

                {/* Desktop Button */}
                <div className="hidden md:block">
                    <Button className="rounded-sm px-6 bg-brand-primary-900">Contribute</Button>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center relative z-50">
                    <button onClick={() => setMenuOpen(prev => !prev)} className="z-50">
                        {/* Hamburger Icon */}
                        <div className="space-y-[5px]">
                            <motion.span
                                animate={isMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                                className="block w-6 h-0.5 bg-black"
                            />
                            <motion.span
                                animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                                className="block w-6 h-0.5 bg-black"
                            />

                        </div>
                    </button>
                </div>
            </div>

            {/* Full-Screen Slide Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        className="fixed top-0 right-0 w-full h-screen bg-background shadow-lg flex flex-col items-center justify-between py-6 z-40 gap-4"
                    >
                        <div
                            className={`flex flex-col items-center text-xl font-normal uppercase space-y-4 w-[90%] h-5/6 justify-center`}
                        >
                            <Link href={"/"} onClick={() => setMenuOpen(false)}>Topics</Link>
                            <Link href={"/"} onClick={() => setMenuOpen(false)}>Features</Link>
                            <Link href={"/"} onClick={() => setMenuOpen(false)}>Stories & Voices</Link>
                            <Link href={"/"} onClick={() => setMenuOpen(false)}>Opportunities & Events</Link>
                            <Link href={"/"} onClick={() => setMenuOpen(false)}>Resources</Link>
                            <Link href={"/"} onClick={() => setMenuOpen(false)}>Data</Link>
                            <Link href={"/"} onClick={() => setMenuOpen(false)}>About</Link>

                        </div>
                        <Button className="rounded-sm px-6 w-11/12 bg-brand-primary-900">Contribute</Button>

                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}

export default Header
