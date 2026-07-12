import type { ContentBlock } from '../content/types'
import { InlineMd } from './ui/InlineMd'
import { SqlBlock } from './ui/SqlBlock'
import { Callout } from './ui/Callout'
import { WIDGETS } from './widgets/registry'

function Block({ block }: { block: ContentBlock }) {
  switch (block.kind) {
    case 'heading': {
      const H = (block.level === 3 ? 'h3' : 'h2') as 'h2' | 'h3'
      return <H className="content-heading">{block.text}</H>
    }
    case 'text':
      return <p><InlineMd text={block.md} /></p>
    case 'callout':
      return <Callout variant={block.variant} title={block.title} md={block.md} />
    case 'sql':
      return <SqlBlock code={block.code} caption={block.caption} />
    case 'list':
      return block.ordered ? (
        <ol className="content-list">
          {block.items.map((it, i) => (
            <li key={i}><InlineMd text={it} /></li>
          ))}
        </ol>
      ) : (
        <ul className="content-list">
          {block.items.map((it, i) => (
            <li key={i}><InlineMd text={it} /></li>
          ))}
        </ul>
      )
    case 'deflist':
      return (
        <div className="deflist">
          {block.rows.map((r, i) => (
            <div key={i} className="deflist-row">
              <div className="deflist-term">{r.term}</div>
              <div className="dim"><InlineMd text={r.def} /></div>
            </div>
          ))}
        </div>
      )
    case 'widget': {
      const Widget = WIDGETS[block.name]
      return (
        <div className="widget-wrap">
          <Widget />
        </div>
      )
    }
  }
}

export function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="content">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
  )
}
