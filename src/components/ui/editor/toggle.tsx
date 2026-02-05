import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { ChevronRight } from 'lucide-react'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

export function ToggleComponent({ node, updateAttributes, editor }: NodeViewProps) {
  const isOpen = node.attrs.open ?? true
  const title = node.attrs.title || 'Toggle title'
  const isEditable = editor.isEditable

  const handleToggle = useCallback(() => {
    updateAttributes({ open: !isOpen })
  }, [isOpen, updateAttributes])

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAttributes({ title: e.target.value })
    },
    [updateAttributes],
  )

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent editor from handling these keys
      if (e.key === 'Enter') {
        e.preventDefault()
        // Open toggle and focus content if pressing Enter
        if (!isOpen) {
          updateAttributes({ open: true })
        }
      }
    },
    [isOpen, updateAttributes],
  )

  return (
    <NodeViewWrapper className="toggle-wrapper">
      <div className="toggle-header" contentEditable={false}>
        <button
          className={cn('toggle-button', isOpen && 'toggle-button-open')}
          onClick={handleToggle}
          type="button"
          aria-expanded={isOpen}
        >
          <ChevronRight size={16} className="toggle-chevron" />
        </button>
        {isEditable ? (
          <input
            type="text"
            className="toggle-title-input"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            placeholder="Toggle title..."
          />
        ) : (
          <span className="toggle-title" onClick={handleToggle}>
            {title}
          </span>
        )}
      </div>
      <div className={cn('toggle-content', !isOpen && 'toggle-content-collapsed')}>
        <NodeViewContent className="toggle-content-inner" />
      </div>
    </NodeViewWrapper>
  )
}
