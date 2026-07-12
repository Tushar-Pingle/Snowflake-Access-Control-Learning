import { NavLink } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useProgress } from '../../context/ProgressContext'
import { Snowflake } from '../ui/Snowflake'

export function Nav() {
  const { theme, toggle } = useTheme()
  const { xp } = useProgress()

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand">
          <Snowflake />
          <span>
            <div className="brand-name">Frostbyte Academy</div>
            <div className="brand-sub">Snowflake Access Control</div>
          </span>
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>Journey</NavLink>
          <NavLink to="/sandbox" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Sandbox</NavLink>
          <NavLink to="/reference" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Reference</NavLink>
          <NavLink to="/progress" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Progress</NavLink>
          <span className="badge xp-badge hide-sm" title="Experience points">⚡ {xp} XP</span>
          <button className="btn btn-sm btn-ghost" onClick={toggle} aria-label="Toggle theme" title="Toggle light/dark">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  )
}
