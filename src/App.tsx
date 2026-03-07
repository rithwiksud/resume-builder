import { useState, useEffect, useRef } from 'react';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import type { ResumeData } from './types';
import { loadResume, saveResume } from './utils/storage';
import { downloadLatex, downloadPdf } from './utils/latex';
import './App.css';

export default function App() {
  const [data, setData] = useState<ResumeData>(loadResume);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState('');
  const saveTimeout = useRef<number>(0);

  useEffect(() => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => saveResume(data), 300);
  }, [data]);

  const handlePdf = async () => {
    setCompiling(true);
    setError('');
    try {
      await downloadPdf(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Compilation failed');
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="app">
      <div className="panel-left">
        <ResumeForm data={data} onChange={setData} />
        <div className="form-actions">
          <button className="btn-download" onClick={() => downloadLatex(data)}>
            Download .tex
          </button>
          <button className="btn-download btn-pdf" onClick={handlePdf} disabled={compiling}>
            {compiling ? 'Compiling...' : 'Download PDF'}
          </button>
          {error && <p className="compile-error">{error}</p>}
        </div>
      </div>
      <div className="panel-right">
        <ResumePreview data={data} />
      </div>
    </div>
  );
}
