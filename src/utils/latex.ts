import type { ResumeData } from '../types';

function esc(s: string): string {
  // First, protect markdown formatting markers
  const parts: string[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(s)) !== null) {
    // Escape the plain text before the match
    parts.push(escPlain(s.slice(lastIndex, match.index)));
    // Handle the formatted segment
    const seg = match[0];
    if (seg.startsWith('**')) {
      parts.push(`\\textbf{${escPlain(seg.slice(2, -2))}}`);
    } else {
      parts.push(`\\textit{${escPlain(seg.slice(1, -1))}}`);
    }
    lastIndex = match.index + match[0].length;
  }
  parts.push(escPlain(s.slice(lastIndex)));
  return parts.join('');
}

function escPlain(s: string): string {
  return s
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, (m) => '\\' + m)
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

export function generateLatex(data: ResumeData): string {
  const lines: string[] = [];
  const m = data.margins;

  lines.push(`\\documentclass[a4paper]{article}
    \\usepackage{fullpage}
    \\usepackage{amsmath}
    \\usepackage{amssymb}
    \\usepackage{textcomp}
    \\usepackage[utf8]{inputenc}
    \\usepackage[T1]{fontenc}
    \\usepackage{ebgaramond}
    \\usepackage[top=${m.top}in, bottom=${m.bottom}in, left=${m.left}in, right=${m.right}in]{geometry}
    \\pagestyle{empty}
    \\raggedright

    \\usepackage{xcolor}
    \\usepackage[colorlinks = true,
                linkcolor = blue,
                urlcolor  = blue,
                citecolor = blue,
                anchorcolor = blue]{hyperref}

\\newcommand{\\lineunder} {
    \\vspace*{-8pt} \\\\
    \\hspace*{-18pt} \\hrulefill \\\\
}

\\newcommand{\\header} [1] {
    {\\hspace*{-18pt}\\vspace*{6pt} \\textsc{#1}}
    \\vspace*{-6pt} \\lineunder
}

\\begin{document}
\\vspace*{-40pt}

\\vspace*{-10pt}
\\begin{center}
\t{\\Huge \\scshape {${escPlain(data.name)}}}\\\\`);

  const contactParts: string[] = [];
  if (data.email) contactParts.push(escPlain(data.email));
  if (data.phone) contactParts.push(escPlain(data.phone));
  data.links.forEach((l) => {
    if (l.label || l.url) {
      contactParts.push(l.url ? `\\href{${escPlain(l.url)}}{${escPlain(l.label || l.url)}}` : escPlain(l.label));
    }
  });
  lines.push(`\t${contactParts.join(' $\\blackdiamond$ ')}\\\\`);
  lines.push(`\\end{center}\n`);

  for (const section of data.sections) {
    if (!section.name && section.entries.every((e) => !e.title)) continue;
    lines.push(`\\header{${escPlain(section.name)}}`);

    for (const entry of section.entries) {
      if (!entry.title && entry.bullets.every((b) => !b)) continue;

      let titleLine = `\\textbf{${esc(entry.title)}}`;
      if (entry.tech) titleLine += ` \\textbf{\\sl ${esc(entry.tech)}}`;
      if (entry.location) titleLine += `\\hfill ${esc(entry.location)}`;
      titleLine += '\\\\';
      lines.push(titleLine);

      if (entry.subtitle || entry.dates) {
        let subLine = '';
        if (entry.subtitle) subLine += `\\textit{${esc(entry.subtitle)}}`;
        if (entry.dates) subLine += ` \\hfill ${esc(entry.dates)}`;
        lines.push(subLine);
      }

      const nonEmptyBullets = entry.bullets.filter((b) => b.trim());
      if (nonEmptyBullets.length > 0) {
        lines.push(`\\begin{itemize} \\itemsep 1pt`);
        for (const bullet of nonEmptyBullets) {
          lines.push(`    \\item ${esc(bullet)}`);
        }
        lines.push(`\\end{itemize}\n`);
      }
    }
    lines.push('');
  }

  lines.push(`\\end{document}`);
  return lines.join('\n');
}

export function downloadLatex(data: ResumeData) {
  const tex = generateLatex(data);
  const blob = new Blob([tex], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.name.replace(/\s+/g, '_') || 'resume'}.tex`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPdf(data: ResumeData): Promise<void> {
  const tex = generateLatex(data);
  const res = await fetch('/api/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tex }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Compilation failed' }));
    throw new Error(err.error || 'Compilation failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.name.replace(/\s+/g, '_') || 'resume'}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
