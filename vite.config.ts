import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs'
import { execSync, execFileSync } from 'child_process'
import { join } from 'path'
import { tmpdir } from 'os'
import { existsSync } from 'fs'

function findPdflatex(): string | null {
  // Try PATH first
  try {
    const result = execSync('which pdflatex 2>/dev/null || where pdflatex 2>/dev/null', { encoding: 'utf-8' }).trim()
    if (result) return result.split('\n')[0]
  } catch {}

  // Common MacTeX / TeX Live locations
  const candidates = [
    '/Library/TeX/texbin/pdflatex',
    '/usr/local/texlive/2025/bin/universal-darwin/pdflatex',
    '/usr/local/texlive/2024/bin/universal-darwin/pdflatex',
    '/usr/local/texlive/2023/bin/universal-darwin/pdflatex',
    '/opt/homebrew/bin/pdflatex',
    '/usr/local/bin/pdflatex',
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return null
}

function latexCompilePlugin(): Plugin {
  const pdflatexPath = findPdflatex()

  return {
    name: 'latex-compile',
    configureServer(server) {
      server.middlewares.use('/api/compile', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        if (!pdflatexPath) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'pdflatex not found. Install MacTeX (brew install --cask mactex) or TeX Live, then restart the dev server.'
          }))
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          let dir = ''
          try {
            const { tex } = JSON.parse(body)
            dir = mkdtempSync(join(tmpdir(), 'resume-'))
            const texPath = join(dir, 'resume.tex')
            writeFileSync(texPath, tex)

            execFileSync(pdflatexPath, ['-interaction=nonstopmode', '-halt-on-error', 'resume.tex'], {
              cwd: dir,
              timeout: 30000,
              stdio: 'pipe',
            })

            const pdfPath = join(dir, 'resume.pdf')
            const pdf = readFileSync(pdfPath)

            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"')
            res.end(pdf)
          } catch (err: unknown) {
            res.statusCode = 500
            let msg = 'Compilation failed'
            // Try to read the log for a better error message
            try {
              if (dir) {
                const log = readFileSync(join(dir, 'resume.log'), 'utf-8')
                const errorLines = log.split('\n').filter(l => l.startsWith('!'))
                if (errorLines.length) msg = errorLines.join('\n')
              }
            } catch {}
            if (msg === 'Compilation failed' && err instanceof Error) msg = err.message
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: msg }))
          } finally {
            if (dir) {
              try { rmSync(dir, { recursive: true }) } catch {}
            }
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), latexCompilePlugin()],
})
