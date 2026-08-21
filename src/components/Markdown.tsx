import { Fragment, type ReactNode } from 'react'

// A small, dependency-free renderer for the subset of Markdown Gemini
// actually produces in this app: **bold**, `inline code`, bullet lists
// (- or *), numbered lists (1.), and paragraph breaks. Not a full
// Markdown spec — just enough that AI responses render cleanly instead
// of showing literal asterisks.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Split on **bold** and `code` spans, preserving the delimiters via capture groups
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-b${i}`}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={`${keyPrefix}-c${i}`} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={`${keyPrefix}-t${i}`}>{part}</Fragment>
  })
}

interface Block {
  type: 'ul' | 'ol' | 'p'
  lines: string[]
}

function toBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const bulletMatch = /^[-*]\s+(.*)/.exec(line)
    const numberedMatch = /^\d+[.)]\s+(.*)/.exec(line)

    if (bulletMatch) {
      const last = blocks[blocks.length - 1]
      if (last && last.type === 'ul') last.lines.push(bulletMatch[1])
      else blocks.push({ type: 'ul', lines: [bulletMatch[1]] })
    } else if (numberedMatch) {
      const last = blocks[blocks.length - 1]
      if (last && last.type === 'ol') last.lines.push(numberedMatch[1])
      else blocks.push({ type: 'ol', lines: [numberedMatch[1]] })
    } else {
      const last = blocks[blocks.length - 1]
      if (last && last.type === 'p') last.lines.push(line)
      else blocks.push({ type: 'p', lines: [line] })
    }
  }

  return blocks
}

export default function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = toBlocks(text)

  return (
    <div className={className}>
      {blocks.map((block, bi) => {
        if (block.type === 'ul') {
          return (
            <ul key={bi} className="list-disc pl-4 space-y-0.5 my-1.5 first:mt-0 last:mb-0">
              {block.lines.map((line, li) => (
                <li key={li}>{renderInline(line, `${bi}-${li}`)}</li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={bi} className="list-decimal pl-4 space-y-0.5 my-1.5 first:mt-0 last:mb-0">
              {block.lines.map((line, li) => (
                <li key={li}>{renderInline(line, `${bi}-${li}`)}</li>
              ))}
            </ol>
          )
        }
        return (
          <p key={bi} className="my-1.5 first:mt-0 last:mb-0">
            {block.lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {renderInline(line, `${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
