import { Link } from 'react-router-dom'
import { Snowflake } from '../components/ui/Snowflake'

export function NotFound() {
  return (
    <div className="container center" style={{ padding: '5rem 0' }}>
      <Snowflake size={48} />
      <h1 style={{ marginTop: 16 }}>Lost in a snowdrift</h1>
      <p className="dim">That page doesn’t exist.</p>
      <Link className="btn btn-primary" to="/">Back to the journey</Link>
    </div>
  )
}
