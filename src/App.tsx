import { useState, useEffect, useRef } from 'react';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import LandingPage from './components/LandingPage';
import type { ResumeData } from './types';
import { loadResume, saveResume } from './utils/storage';
import { downloadResumeZip } from './utils/latex';
import './App.css';

function hasContent(data: ResumeData): boolean {
  return data.name.trim().length > 0;
}

export default function App() {
  const [data, setData] = useState<ResumeData>(loadResume);
  const [view, setView] = useState<'landing' | 'editor'>(() =>
    hasContent(loadResume()) ? 'editor' : 'landing',
  );
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [filename, setFilename] = useState('my_resume');
  const saveTimeout = useRef<number>(0);

  useEffect(() => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => saveResume(data), 300);
  }, [data]);

  const handleDownload = async () => {
    setCompiling(true);
    setError('');
    setWarning('');
    try {
      const w = await downloadResumeZip(data, filename);
      if (w) setWarning(w);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setCompiling(false);
    }
  };

  const handleStart = (resumeData: ResumeData) => {
    setData(resumeData);
    saveResume(resumeData);
    setView('editor');
  };

  if (view === 'landing') {
    return <LandingPage onStart={handleStart} />;
  }

  return (
    <div className="app">
      <div className="panel-left">
        <ResumeForm data={data} onChange={setData} />
        <div className="form-actions">
          <input
            type="text"
            className="filename-input"
            value={filename}
            onChange={(e) => setFilename(e.target.value.replace(/[^\w\-]/g, '_') || 'my_resume')}
            placeholder="Filename"
          />
          <button className="btn-download" onClick={handleDownload} disabled={compiling}>
            {compiling ? 'Compiling...' : 'Download Resume'}
          </button>
          {warning && <p className="compile-warning">{warning}</p>}
          {error && <p className="compile-error">{error}</p>}
          <button
            className="btn-back"
            onClick={() => setView('landing')}
          >
            Back to Start
          </button>
        </div>
      </div>
      <div className="panel-right">
        <ResumePreview data={data} />
      </div>
    </div>
  );
}
