import type { Passport } from "./types";

const STORAGE_KEY = "voice-passport-v1";

export function loadPassport(): Passport | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as Passport;
  } catch {
    return null;
  }
}

export function savePassport(passport: Passport) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(passport));
}

export function clearPassport() {
  window.localStorage.removeItem(STORAGE_KEY);
}
