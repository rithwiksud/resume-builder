export interface ResumeLink {
  id: string;
  label: string;
  url: string;
}

export interface ResumeEntry {
  id: string;
  title: string;
  tech: string;
  location: string;
  subtitle: string;
  dates: string;
  bullets: string[];
}

export interface ResumeSection {
  id: string;
  name: string;
  entries: ResumeEntry[];
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  links: ResumeLink[];
  sections: ResumeSection[];
  margins: Margins;
}

export function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyEntry(): ResumeEntry {
  return { id: createId(), title: '', tech: '', location: '', subtitle: '', dates: '', bullets: [''] };
}

export function emptySection(): ResumeSection {
  return { id: createId(), name: '', entries: [emptyEntry()] };
}

export const defaultMargins: Margins = { top: 0.45, right: 0.55, bottom: 0.45, left: 0.55 };

export function defaultResume(): ResumeData {
  return {
    name: '',
    email: '',
    phone: '',
    links: [],
    sections: [emptySection()],
    margins: { ...defaultMargins },
  };
}
