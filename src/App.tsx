import { Routes, Route } from 'react-router-dom'
import { Nav } from './components/layout/Nav'
import { Home } from './pages/Home'
import { LevelPage } from './pages/LevelPage'
import { SandboxPage } from './pages/SandboxPage'
import { ReferencePage } from './pages/ReferencePage'
import { ProgressPage } from './pages/ProgressPage'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <div className="app">
      <Nav />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/level/:slug" element={<LevelPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="/reference" element={<ReferencePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container spread">
          <span className="muted">Frostbyte Academy · an open, interactive guide to Snowflake Access Control.</span>
          <span className="muted">Not affiliated with Snowflake Inc. · Built for learning.</span>
        </div>
      </footer>
    </div>
  )
}
