import type { ResumeData, ResumeSection, ResumeEntry } from '../types';
import { createId, defaultMargins } from '../types';

// Convert LaTeX inline formatting to our markdown-like syntax
function latexToMarkdown(s: string): string {
  // \textbf{...} -> **...**
  s = s.replace(/\\textbf\{([^}]*)}/g, '**$1**');
  // \textit{...} or \emph{...} -> *...*
  s = s.replace(/\\textit\{([^}]*)}/g, '*$1*');
  s = s.replace(/\\emph\{([^}]*)}/g, '*$1*');
  // \underline{...} -> just text
  s = s.replace(/\\underline\{([^}]*)}/g, '$1');
  // \href{url}{text} -> text
  s = s.replace(/\\href\{[^}]*}\{([^}]*)}/g, '$1');
  // Remove remaining simple commands
  s = s.replace(/\\textasciitilde\{}/g, '~');
  s = s.replace(/\\textbackslash\{}/g, '\\');
  // Unescape LaTeX special chars
  s = s.replace(/\\([&%$#_{}])/g, '$1');
  // Remove \hfill and similar spacing commands inline
  s = s.replace(/\\hfill\s*/g, '');
  // Clean up
  s = s.trim();
  return s;
}

// Strip LaTeX commands for plain extraction
function stripLatex(s: string): string {
  return latexToMarkdown(s)
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .trim();
}

export function parseTexFile(tex: string): ResumeData {
  const data: ResumeData = {
    name: '',
    email: '',
    phone: '',
    links: [],
    sections: [],
    margins: { ...defaultMargins },
  };

  // Extract name from {\Huge \scshape {NAME}}
  const nameMatch = tex.match(/\\Huge\s*\\scshape\s*\{([^}]*)}/);
  if (nameMatch) data.name = stripLatex(nameMatch[1]);

  // Extract contact line - the line after \scshape with diamonds
  const contactMatch = tex.match(/\\scshape\s*\{[^}]*}\}\\\\[\s\n]*([^\n]+?)\\\\[\s\n]*\\end\{center}/s);
  if (contactMatch) {
    const contactLine = contactMatch[1];
    const parts = contactLine.split(/\$\\blackdiamond\$/);
    for (const part of parts) {
      const cleaned = stripLatex(part).trim();
      if (!cleaned) continue;
      if (cleaned.includes('@')) {
        data.email = cleaned;
      } else if (/^\+?\d[\d\s\-()]+$/.test(cleaned)) {
        data.phone = cleaned;
      } else {
        // Check if there's an href
        const hrefMatch = part.match(/\\href\{([^}]*)}\{([^}]*)}/);
        if (hrefMatch) {
          data.links.push({ id: createId(), label: stripLatex(hrefMatch[2]), url: stripLatex(hrefMatch[1]) });
        } else {
          data.links.push({ id: createId(), label: cleaned, url: '' });
        }
      }
    }
  }

  // Extract margins from geometry package or textheight
  const geometryMatch = tex.match(/\\usepackage\[([^\]]*)\]\{geometry\}/);
  if (geometryMatch) {
    const opts = geometryMatch[1];
    const topM = opts.match(/top=([\d.]+)in/);
    const bottomM = opts.match(/bottom=([\d.]+)in/);
    const leftM = opts.match(/left=([\d.]+)in/);
    const rightM = opts.match(/right=([\d.]+)in/);
    if (topM) data.margins.top = parseFloat(topM[1]);
    if (bottomM) data.margins.bottom = parseFloat(bottomM[1]);
    if (leftM) data.margins.left = parseFloat(leftM[1]);
    if (rightM) data.margins.right = parseFloat(rightM[1]);
  }

  // Extract content between \begin{document} and \end{document}
  const docMatch = tex.match(/\\begin\{document\}([\s\S]*)\\end\{document\}/);
  if (!docMatch) return data;
  const body = docMatch[1];

  // Remove \iftrue ... \fi and \iffalse ... \fi blocks (keep \iftrue content, remove \iffalse content)
  let cleaned = body;
  // Remove \iffalse blocks first
  cleaned = cleaned.replace(/\\iffalse[\s\S]*?\\fi/g, '');
  // Remove \iftrue and \fi markers but keep content
  cleaned = cleaned.replace(/\\iftrue\s*/g, '');
  cleaned = cleaned.replace(/\\fi\s*/g, '');

  // Split by \header{...} to find sections
  const headerRegex = /\\header\{([^}]*)}/g;
  const headers: { name: string; start: number; end: number }[] = [];
  let m;
  while ((m = headerRegex.exec(cleaned)) !== null) {
    headers.push({ name: stripLatex(m[1]), start: m.index + m[0].length, end: 0 });
  }

  // Set end positions
  for (let i = 0; i < headers.length; i++) {
    headers[i].end = i + 1 < headers.length ? headers[i + 1].start - headers[i + 1].name.length - 10 : cleaned.length;
  }

  for (const header of headers) {
    const sectionBody = cleaned.slice(header.start, header.end);
    const section: ResumeSection = { id: createId(), name: header.name, entries: [] };

    // Parse entries: look for \textbf{...} lines that start entries
    // Split by entry-starting patterns
    const entryChunks = sectionBody.split(/(?=\\textbf\{)/);

    for (const chunk of entryChunks) {
      if (!chunk.trim() || !chunk.includes('\\textbf{')) continue;

      const entry: ResumeEntry = { id: createId(), title: '', tech: '', location: '', subtitle: '', dates: '', bullets: [] };

      // First line: \textbf{Title} possibly \textbf{\sl Tech} \hfill Location
      const firstLine = chunk.split('\n')[0];

      // Extract title
      const titleMatch = firstLine.match(/\\textbf\{([^}]*)}/);
      if (titleMatch) entry.title = stripLatex(titleMatch[1]);

      // Extract tech (\textbf{\sl ...} or \textbf{\sl ...})
      const techMatch = firstLine.match(/\\textbf\{\\sl\s+([^}]*)}/);
      if (techMatch) entry.tech = stripLatex(techMatch[1]);

      // Extract location (after \hfill)
      const locMatch = firstLine.match(/\\hfill\s*(.+?)\\\\?$/);
      if (locMatch) entry.location = stripLatex(locMatch[1]);

      // Extract subtitle (\textit{...})
      const subMatch = chunk.match(/\\textit\{([^}]*)}/);
      if (subMatch) entry.subtitle = stripLatex(subMatch[1]);

      // Extract dates (after \hfill on subtitle line, or standalone)
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.includes('\\textit{') && line.includes('\\hfill')) {
          const datesMatch = line.match(/\\hfill\s*(.+?)\\\\?$/);
          if (datesMatch) entry.dates = stripLatex(datesMatch[1]);
          break;
        }
        // Also check for dates on lines without \textit but with \hfill after the first line
        if (line !== firstLine && !line.includes('\\textbf{') && line.includes('\\hfill')) {
          const datesMatch = line.match(/\\hfill\s*(.+?)\\\\?$/);
          if (datesMatch && !entry.dates) entry.dates = stripLatex(datesMatch[1]);
        }
      }

      // Extract bullets
      const itemRegex = /\\item\s+([\s\S]*?)(?=\\item|\\end\{itemize})/g;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(chunk)) !== null) {
        const bulletText = latexToMarkdown(itemMatch[1].replace(/\n/g, ' ').trim());
        if (bulletText) entry.bullets.push(bulletText);
      }

      if (entry.bullets.length === 0) entry.bullets.push('');

      if (entry.title || entry.bullets.some(b => b)) {
        section.entries.push(entry);
      }
    }

    if (section.entries.length === 0) {
      // Maybe this section has non-entry content (like Skills)
      const plainText = stripLatex(sectionBody).trim();
      if (plainText) {
        section.entries.push({
          id: createId(), title: '', tech: '', location: '',
          subtitle: '', dates: '', bullets: [latexToMarkdown(sectionBody.trim())]
        });
      }
    }

    if (section.entries.length > 0) {
      data.sections.push(section);
    }
  }

  if (data.sections.length === 0) {
    data.sections.push({ id: createId(), name: '', entries: [{ id: createId(), title: '', tech: '', location: '', subtitle: '', dates: '', bullets: [''] }] });
  }

  return data;
}
