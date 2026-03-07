import type { ResumeData } from '../types';
import './ResumePreview.css';

interface Props {
  data: ResumeData;
}

// Render **bold** and *italic* markdown-like syntax
function FormattedText({ text }: { text: string }) {
  const parts: (JSX.Element | string)[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const seg = match[0];
    if (seg.startsWith('**')) {
      parts.push(<strong key={key++}>{seg.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={key++}>{seg.slice(1, -1)}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}

export default function ResumePreview({ data }: Props) {
  const contactParts: string[] = [];
  if (data.email) contactParts.push(data.email);
  if (data.phone) contactParts.push(data.phone);
  data.links.forEach((l) => {
    if (l.label || l.url) contactParts.push(l.label || l.url);
  });

  const m = data.margins;
  const pageStyle = {
    paddingTop: `${m.top}in`,
    paddingRight: `${m.right}in`,
    paddingBottom: `${m.bottom}in`,
    paddingLeft: `${m.left}in`,
  };

  return (
    <div className="preview">
      <div className="resume-page" style={pageStyle}>
        {/* Profile */}
        <div className="profile">
          <h1>{data.name || 'Your Name'}</h1>
          {contactParts.length > 0 && (
            <p className="contact-line">
              {contactParts.map((part, i) => (
                <span key={i}>
                  {i > 0 && <span className="diamond"> ◆ </span>}
                  {part}
                </span>
              ))}
            </p>
          )}
        </div>

        {/* Sections */}
        {data.sections.map((section) => {
          if (!section.name && section.entries.every((e) => !e.title)) return null;
          return (
            <div key={section.id} className="resume-section">
              <div className="section-header">
                <span className="section-title">{section.name}</span>
                <hr />
              </div>

              {section.entries.map((entry) => {
                if (!entry.title && entry.bullets.every((b) => !b)) return null;
                return (
                  <div key={entry.id} className="resume-entry">
                    <div className="entry-title-row">
                      <span>
                        <strong><FormattedText text={entry.title} /></strong>
                        {entry.tech && <span className="tech"> <FormattedText text={entry.tech} /></span>}
                      </span>
                      {entry.location && <span className="right"><FormattedText text={entry.location} /></span>}
                    </div>
                    {(entry.subtitle || entry.dates) && (
                      <div className="entry-subtitle-row">
                        {entry.subtitle && <em><FormattedText text={entry.subtitle} /></em>}
                        {entry.dates && <span className="right"><FormattedText text={entry.dates} /></span>}
                      </div>
                    )}
                    {entry.bullets.some((b) => b.trim()) && (
                      <ul>
                        {entry.bullets.map(
                          (b, i) => b.trim() && <li key={i}><FormattedText text={b} /></li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
