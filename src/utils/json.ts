import type { ResumeData, ResumeSection, ResumeEntry, ResumeLink } from '../types';
import { createId, defaultMargins } from '../types';

export function exportResumeJson(data: ResumeData): string {
  return JSON.stringify(data, null, 2);
}

export function importResumeJson(raw: string): ResumeData {
  // Strip markdown code fences that LLMs add
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Invalid JSON: could not parse input');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid resume data: expected a JSON object');
  }

  const obj = parsed as Record<string, unknown>;

  // Validate required top-level keys
  const requiredKeys = ['name', 'sections'];
  for (const key of requiredKeys) {
    if (!(key in obj)) {
      throw new Error(`Missing required field: "${key}"`);
    }
  }

  if (!Array.isArray(obj.sections)) {
    throw new Error('Invalid resume data: "sections" must be an array');
  }

  // Normalize data
  const data: ResumeData = {
    name: String(obj.name ?? ''),
    email: String(obj.email ?? ''),
    phone: String(obj.phone ?? ''),
    links: normalizeLinks(obj.links),
    sections: (obj.sections as unknown[]).map(normalizeSection),
    margins: normalizeMargins(obj.margins),
  };

  return data;
}

function normalizeLinks(raw: unknown): ResumeLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((l: unknown) => {
    const link = (typeof l === 'object' && l !== null ? l : {}) as Record<string, unknown>;
    return {
      id: String(link.id ?? '') || createId(),
      label: String(link.label ?? ''),
      url: String(link.url ?? ''),
    };
  });
}

function normalizeSection(raw: unknown): ResumeSection {
  const s = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    id: String(s.id ?? '') || createId(),
    name: String(s.name ?? ''),
    entries: Array.isArray(s.entries) ? s.entries.map(normalizeEntry) : [],
  };
}

function normalizeEntry(raw: unknown): ResumeEntry {
  const e = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  let bullets: string[] = [];
  if (Array.isArray(e.bullets) && e.bullets.length > 0) {
    bullets = e.bullets.map((b: unknown) => String(b ?? ''));
  } else {
    bullets = [''];
  }
  return {
    id: String(e.id ?? '') || createId(),
    title: String(e.title ?? ''),
    tech: String(e.tech ?? ''),
    location: String(e.location ?? ''),
    subtitle: String(e.subtitle ?? ''),
    dates: String(e.dates ?? ''),
    bullets,
  };
}

function normalizeMargins(raw: unknown): ResumeData['margins'] {
  if (typeof raw !== 'object' || raw === null) return { ...defaultMargins };
  const m = raw as Record<string, unknown>;
  return {
    top: typeof m.top === 'number' ? m.top : defaultMargins.top,
    right: typeof m.right === 'number' ? m.right : defaultMargins.right,
    bottom: typeof m.bottom === 'number' ? m.bottom : defaultMargins.bottom,
    left: typeof m.left === 'number' ? m.left : defaultMargins.left,
  };
}
