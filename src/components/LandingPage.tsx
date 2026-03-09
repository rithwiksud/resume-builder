import { useState, useRef } from 'react';
import type { ResumeData } from '../types';
import { defaultResume } from '../types';
import { importResumeJson } from '../utils/json';
import './LandingPage.css';

type Step = 'start' | 'existing-source' | 'load-json' | 'llm-convert';

interface Props {
  onStart: (data: ResumeData) => void;
}

const LLM_PROMPT = `Convert my resume into the following JSON format. Follow these rules exactly:

1. Use empty strings ("") for any fields that don't apply
2. Do NOT include "id" fields — they will be generated automatically
3. Every entry MUST have a "bullets" array. Use [""] if there are no bullet points
4. Use markdown for formatting: **bold** and *italic*
5. Output ONLY the JSON, no explanation

JSON Schema:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "123-456-7890",
  "links": [
    { "label": "Display Text", "url": "https://..." }
  ],
  "sections": [
    {
      "name": "Section Title",
      "entries": [
        {
          "title": "Company or Project Name",
          "tech": "Key Highlights",
          "location": "City, State",
          "subtitle": "Role or Degree",
          "dates": "Start - End",
          "bullets": [
            "Accomplishment or description",
            "Another bullet point"
          ]
        }
      ]
    }
  ]
}

Here is my resume:
`;

export default function LandingPage({ onStart }: Props) {
  const [step, setStep] = useState<Step>('start');
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoad = () => {
    setError('');
    try {
      const data = importResumeJson(jsonText);
      onStart(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON');
    }
  };

  const handleFile = (file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        const data = importResumeJson(text);
        onStart(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(LLM_PROMPT);
  };

  return (
    <div className="landing">
      <div className="landing-card">
        {step !== 'start' && (
          <button
            className="landing-back"
            onClick={() => {
              setError('');
              setJsonText('');
              setStep(step === 'load-json' || step === 'llm-convert' ? 'existing-source' : 'start');
            }}
          >
            &larr; Back
          </button>
        )}

        {step === 'start' && (
          <>
            <div className="landing-emoji">😊</div>
            <h1 className="landing-title">Résumé for Dummies</h1>
            <div className="landing-buttons">
              <button className="landing-btn landing-btn-primary" onClick={() => onStart(defaultResume())}>
                Create New
              </button>
              <button className="landing-btn landing-btn-secondary" onClick={() => setStep('existing-source')}>
                Edit Existing
              </button>
            </div>
          </>
        )}

        {step === 'existing-source' && (
          <>
            <h2>Made on this website?</h2>
            <p className="landing-subtitle">Did you previously make and download a resume on this site?</p>
            <div className="landing-buttons">
              <button className="landing-btn landing-btn-primary" onClick={() => setStep('load-json')}>
                Yes
              </button>
              <button className="landing-btn landing-btn-danger" onClick={() => setStep('llm-convert')}>
                No
              </button>
            </div>
          </>
        )}

        {step === 'load-json' && (
          <>
            <h2>Load your resume</h2>
            <div
              className={`drop-zone ${dragging ? 'drop-zone-active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <p>Drop .json file here or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
            <p className="landing-or">or paste JSON below</p>
            <textarea
              className="landing-textarea"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste your resume JSON here..."
              rows={8}
            />
            <button className="landing-btn landing-btn-primary landing-btn-full" onClick={handleLoad} disabled={!jsonText.trim()}>
              Load
            </button>
          </>
        )}

        {step === 'llm-convert' && (
          <>
            <h2>Convert with AI</h2>
            <ol className="landing-steps">
              <li>Drop your existing resume PDF into ChatGPT.</li>
              <li>Paste the prompt below into ChatGPT.</li>
              <li>Paste the output in our text box below.</li>
            </ol>
            <div className="prompt-box">
              <pre className="prompt-text">{LLM_PROMPT}</pre>
              <button className="prompt-copy" onClick={handleCopyPrompt}>
                Copy Prompt
              </button>
            </div>
            <textarea
              className="landing-textarea"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste the JSON result from the LLM here..."
              rows={8}
            />
            <button className="landing-btn landing-btn-primary landing-btn-full" onClick={handleLoad} disabled={!jsonText.trim()}>
              Load
            </button>
          </>
        )}

        {error && <p className="landing-error">{error}</p>}
      </div>
    </div>
  );
}
