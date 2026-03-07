import type { ResumeData } from '../types';
import { defaultResume, defaultMargins } from '../types';

const KEY = 'resume-maker-data';

export function loadResume(): ResumeData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.margins) parsed.margins = { ...defaultMargins };
      return parsed;
    }
  } catch {}
  return defaultResume();
}

export function saveResume(data: ResumeData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
