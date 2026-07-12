import { useState } from 'react'
import { OBJECT_HIERARCHY, type ObjectNode } from '../../content/objectModel'

const LEVEL_COLOR: Record<ObjectNode['level'], string> = {
  organization: '#a78bfa',
  account: '#f87171',
  database: '#38bdf8',
  schema: '#34d399',
}

function TreeNode({ node, depth, onSelect, selected }: { node: ObjectNode; depth: number; onSelect: (n: ObjectNode) => void; selected: ObjectNode | null }) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = !!node.children?.length
  return (
    <div className="tree-node" style={{ marginLeft: depth * 18 }}>
      <div className={`tree-row ${selected === node ? 'sel' : ''}`}>
        {hasChildren ? (
          <button className="tree-toggle" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Collapse' : 'Expand'}>
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="tree-toggle" />
        )}
        <button className="tree-name" onClick={() => onSelect(node)}>
          <span className="tree-dot" style={{ background: LEVEL_COLOR[node.level] }} />
          {node.name}
          <span className="badge badge-muted" style={{ marginLeft: 8 }}>{node.level}</span>
        </button>
      </div>
      {open && node.contains && (
        <div className="tree-contains" style={{ marginLeft: 26 }}>
          {node.contains.map((c) => (
            <span key={c} className="chip" style={{ cursor: 'default' }}>{c}</span>
          ))}
        </div>
      )}
      {open && hasChildren && node.children!.map((c) => <TreeNode key={c.name} node={c} depth={depth + 1} onSelect={onSelect} selected={selected} />)}
    </div>
  )
}

export function ObjectHierarchyTree() {
  const [selected, setSelected] = useState<ObjectNode | null>(OBJECT_HIERARCHY)
  return (
    <div className="widget">
      <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '1rem', alignItems: 'start' }}>
        <div className="card">
          <TreeNode node={OBJECT_HIERARCHY} depth={0} onSelect={setSelected} selected={selected} />
        </div>
        {selected && (
          <div className="card" style={{ borderColor: LEVEL_COLOR[selected.level] }}>
            <div className="spread">
              <h3 style={{ margin: 0 }}>{selected.name}</h3>
              <span className="badge" style={{ background: 'transparent', color: LEVEL_COLOR[selected.level] }}>{selected.level}</span>
            </div>
            <p className="dim" style={{ marginBottom: selected.contains ? 8 : 0 }}>{selected.blurb}</p>
            {selected.contains && (
              <>
                <div className="muted" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>Directly contains:</div>
                <div className="row">
                  {selected.contains.map((c) => (
                    <span key={c} className="chip" style={{ cursor: 'default' }}>{c}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
