import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Removes properties with `undefined` values from an object.
 * This is useful for cleaning objects before sending them to Firestore,
 * which does not support `undefined` values.
 * @param obj The object to sanitize.
 * @returns A new object with `undefined` properties removed.
 */
export function sanitizeObject<T extends object>(obj: T): Partial<T> {
  const newObj: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}
