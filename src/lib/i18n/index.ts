import { en } from './locales/en';
import { hi } from './locales/hi';

export const locales = { en, hi };

export type Locale = keyof typeof locales;
export type Dictionary = typeof en;

    