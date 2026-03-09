import type { ResumeData, ResumeSection, ResumeEntry, Margins } from '../types';
import { createId, emptyEntry, emptySection } from '../types';
import './ResumeForm.css';

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export default function ResumeForm({ data, onChange }: Props) {
  const set = (patch: Partial<ResumeData>) => onChange({ ...data, ...patch });

  const updateSection = (idx: number, patch: Partial<ResumeSection>) => {
    const sections = data.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    set({ sections });
  };

  const updateEntry = (sIdx: number, eIdx: number, patch: Partial<ResumeEntry>) => {
    const sections = data.sections.map((s, si) =>
      si === sIdx ? { ...s, entries: s.entries.map((e, ei) => (ei === eIdx ? { ...e, ...patch } : e)) } : s
    );
    set({ sections });
  };

  const updateBullet = (sIdx: number, eIdx: number, bIdx: number, value: string) => {
    const sections = data.sections.map((s, si) =>
      si === sIdx
        ? {
            ...s,
            entries: s.entries.map((e, ei) =>
              ei === eIdx ? { ...e, bullets: e.bullets.map((b, bi) => (bi === bIdx ? value : b)) } : e
            ),
          }
        : s
    );
    set({ sections });
  };

  const addBullet = (sIdx: number, eIdx: number) => {
    const sections = data.sections.map((s, si) =>
      si === sIdx
        ? { ...s, entries: s.entries.map((e, ei) => (ei === eIdx ? { ...e, bullets: [...e.bullets, ''] } : e)) }
        : s
    );
    set({ sections });
  };

  const removeBullet = (sIdx: number, eIdx: number, bIdx: number) => {
    const sections = data.sections.map((s, si) =>
      si === sIdx
        ? {
            ...s,
            entries: s.entries.map((e, ei) =>
              ei === eIdx ? { ...e, bullets: e.bullets.filter((_, bi) => bi !== bIdx) } : e
            ),
          }
        : s
    );
    set({ sections });
  };

  const setMargin = (key: keyof Margins, val: number) => {
    set({ margins: { ...data.margins, [key]: val } });
  };

  return (
    <div className="form">
      <div className="form-header">
        <h2>Resume Builder</h2>
      </div>

      <details className="advanced-settings">
        <summary>Advanced Settings</summary>
        <fieldset>
          <legend>Margins (inches)</legend>
          <div className="margin-grid">
            {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
              <div key={side} className="margin-slider">
                <label>{side}: {data.margins[side].toFixed(2)}in</label>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={data.margins[side]}
                  onChange={(e) => setMargin(side, parseFloat(e.target.value))}
                />
              </div>
            ))}
          </div>
        </fieldset>
      </details>

      <fieldset>
        <legend>Profile</legend>
        <input placeholder="Full Name" value={data.name} onChange={(e) => set({ name: e.target.value })} />
        <input placeholder="Email" value={data.email} onChange={(e) => set({ email: e.target.value })} />
        <input placeholder="Phone" value={data.phone} onChange={(e) => set({ phone: e.target.value })} />

        <label className="sub-label">Links</label>
        {data.links.map((link, i) => (
          <div key={link.id} className="row">
            <input
              placeholder="Label"
              value={link.label}
              onChange={(e) => {
                const links = data.links.map((l, li) => (li === i ? { ...l, label: e.target.value } : l));
                set({ links });
              }}
            />
            <input
              placeholder="URL"
              value={link.url}
              onChange={(e) => {
                const links = data.links.map((l, li) => (li === i ? { ...l, url: e.target.value } : l));
                set({ links });
              }}
            />
            <button className="btn-sm danger" onClick={() => set({ links: data.links.filter((_, li) => li !== i) })}>
              x
            </button>
          </div>
        ))}
        <button className="btn-sm" onClick={() => set({ links: [...data.links, { id: createId(), label: '', url: '' }] })}>
          + Link
        </button>
      </fieldset>

      {data.sections.map((section, sIdx) => (
        <fieldset key={section.id}>
          <legend>
            <input
              className="section-name"
              placeholder="Section Name (e.g. Work Experience)"
              value={section.name}
              onChange={(e) => updateSection(sIdx, { name: e.target.value })}
            />
            <button
              className="btn-sm danger"
              onClick={() => set({ sections: data.sections.filter((_, i) => i !== sIdx) })}
            >
              Delete Section
            </button>
          </legend>

          {section.entries.map((entry, eIdx) => (
            <div key={entry.id} className="entry">
              <div className="row">
                <input placeholder="Title / Org" value={entry.title} onChange={(e) => updateEntry(sIdx, eIdx, { title: e.target.value })} />
                <input placeholder="Highlights" value={entry.tech} onChange={(e) => updateEntry(sIdx, eIdx, { tech: e.target.value })} />
              </div>
              <div className="row">
                <input placeholder="Role / Subtitle" value={entry.subtitle} onChange={(e) => updateEntry(sIdx, eIdx, { subtitle: e.target.value })} />
                <input placeholder="Location" value={entry.location} onChange={(e) => updateEntry(sIdx, eIdx, { location: e.target.value })} />
              </div>
              <input placeholder="Dates" value={entry.dates} onChange={(e) => updateEntry(sIdx, eIdx, { dates: e.target.value })} />

              {entry.bullets.map((bullet, bIdx) => (
                <div key={bIdx} className="row bullet-row">
                  <span className="bullet-dot">*</span>
                  <textarea
                    placeholder="Bullet point — use **bold** and *italic*"
                    value={bullet}
                    rows={2}
                    onChange={(e) => updateBullet(sIdx, eIdx, bIdx, e.target.value)}
                  />
                  <button className="btn-sm danger" onClick={() => removeBullet(sIdx, eIdx, bIdx)}>x</button>
                </div>
              ))}
              <div className="row">
                <button className="btn-sm" onClick={() => addBullet(sIdx, eIdx)}>+ Bullet</button>
                <button
                  className="btn-sm danger"
                  onClick={() => updateSection(sIdx, { entries: section.entries.filter((_, i) => i !== eIdx) })}
                >
                  Remove Entry
                </button>
              </div>
              <hr />
            </div>
          ))}
          <button className="btn-sm" onClick={() => updateSection(sIdx, { entries: [...section.entries, emptyEntry()] })}>
            + Entry
          </button>
        </fieldset>
      ))}

      <button className="btn-primary" onClick={() => set({ sections: [...data.sections, emptySection()] })}>
        + Add Section
      </button>

      <p className="format-hint">Formatting: use **bold** and *italic* in any text field</p>
    </div>
  );
}
