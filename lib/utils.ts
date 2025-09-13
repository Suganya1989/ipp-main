import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a date string into dd-MMM-yyyy (e.g., 05-Sep-2025).
// If parsing fails, returns the original input.
export function formatDateDMY(input?: string | null): string {
  if (!input) return ''
  const d = new Date(input)
  if (isNaN(d.getTime())) return input
  const dd = String(d.getDate()).padStart(2, '0')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const mmm = months[d.getMonth()]
  const yyyy = d.getFullYear()
  return `${dd}-${mmm}-${yyyy}`
}

// Return a context-aware fallback image based on theme/tags
export function getFallbackImage(theme?: string, tags?: string[]): string {
  const haystack = [theme || '', ...(tags || [])]
    .join(' ') // combine
    .toLowerCase()
  
  // Check for human rights theme (case-insensitive)
  if (haystack.toLowerCase().includes('rights')) {
    return '/hr.png'
  }
  
  // Check for health theme (case-insensitive)
  if (haystack.includes('health')) {
    return '/Trending3.png'
  }
  
  // Default fallback image
  return '/Rules1.png'
}
