import { useEffect, useState, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link,
  Highlighter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BubbleMenuProps {
  editor: Editor
}

export function BubbleMenu({ editor }: BubbleMenuProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    const { selection } = editor.state
    const { from, to } = selection

    if (from === to) {
      setIsVisible(false)
      return
    }

    // Check if selection is text (not node selection)
    const isTextSelection = !selection.empty && editor.state.doc.textBetween(from, to, ' ').length > 0

    if (!isTextSelection) {
      setIsVisible(false)
      return
    }

    const { view } = editor
    const start = view.coordsAtPos(from)
    const end = view.coordsAtPos(to)

    // Position above the selection
    const left = (start.left + end.left) / 2
    const top = start.top - 50

    setPosition({ top, left })
    setIsVisible(true)
  }, [editor])

  useEffect(() => {
    editor.on('selectionUpdate', updatePosition)
    editor.on('blur', () => setIsVisible(false))

    return () => {
      editor.off('selectionUpdate', updatePosition)
      editor.off('blur', () => setIsVisible(false))
    }
  }, [editor, updatePosition])

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    setShowLinkInput(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const toggleLink = useCallback(() => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
    } else {
      const previousUrl = editor.getAttributes('link').href ?? ''
      setLinkUrl(previousUrl)
      setShowLinkInput(true)
    }
  }, [editor])

  if (!isVisible) {
    return null
  }

  if (showLinkInput) {
    return (
      <div
        ref={menuRef}
        className="bubble-menu"
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          transform: 'translateX(-50%)',
          zIndex: 50,
        }}
      >
        <div className="bubble-menu-link-input">
          <input
            type="url"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setLink()
              } else if (e.key === 'Escape') {
                setShowLinkInput(false)
                setLinkUrl('')
              }
            }}
            autoFocus
          />
          <button onClick={setLink} className="bubble-menu-link-submit">
            Apply
          </button>
          <button
            onClick={() => {
              setShowLinkInput(false)
              setLinkUrl('')
            }}
            className="bubble-menu-link-cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className="bubble-menu"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 50,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'bubble-menu-button',
          editor.isActive('bold') && 'bubble-menu-button-active'
        )}
        title="Bold (Cmd+B)"
      >
        <Bold size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'bubble-menu-button',
          editor.isActive('italic') && 'bubble-menu-button-active'
        )}
        title="Italic (Cmd+I)"
      >
        <Italic size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          'bubble-menu-button',
          editor.isActive('underline') && 'bubble-menu-button-active'
        )}
        title="Underline (Cmd+U)"
      >
        <UnderlineIcon size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(
          'bubble-menu-button',
          editor.isActive('strike') && 'bubble-menu-button-active'
        )}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <div className="bubble-menu-divider" />

      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={cn(
          'bubble-menu-button',
          editor.isActive('code') && 'bubble-menu-button-active'
        )}
        title="Inline Code (Cmd+E)"
      >
        <Code size={16} />
      </button>

      <button
        onClick={toggleLink}
        className={cn(
          'bubble-menu-button',
          editor.isActive('link') && 'bubble-menu-button-active'
        )}
        title="Add Link (Cmd+K)"
      >
        <Link size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={cn(
          'bubble-menu-button',
          editor.isActive('highlight') && 'bubble-menu-button-active'
        )}
        title="Highlight"
      >
        <Highlighter size={16} />
      </button>
    </div>
  )
}
