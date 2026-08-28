import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(str: string) {
  if (!str) return false
  if (str.startsWith("/uploads/")) return true
  try { const url = new URL(str); return url.protocol === "http:" || url.protocol === "https:" }
  catch { return false }
}
