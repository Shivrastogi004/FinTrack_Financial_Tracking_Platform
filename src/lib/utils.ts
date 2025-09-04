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
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as T;
  }
  const newObj: any = {};
  for (const key in obj) {
    const value = (obj as any)[key];
    if (value !== undefined) {
      newObj[key] = sanitizeObject(value);
    }
  }
  return newObj;
}