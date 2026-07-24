import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(str: string) {
  try { const url = new URL(str); return url.protocol === "http:" || url.protocol === "https:" }
  catch { return false }
}
