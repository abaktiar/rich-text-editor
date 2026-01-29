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
import { Button } from '@/components/ui/button'

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
        data-slot="editor-bubble-menu"
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
          <Button size="xs" onClick={setLink}>
            Apply
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setShowLinkInput(false)
              setLinkUrl('')
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className="bubble-menu"
      data-slot="editor-bubble-menu"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 50,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Button
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(editor.isActive('bold') && 'bg-primary text-primary-foreground')}
        title="Bold (Cmd+B)"
      >
        <Bold size={16} />
      </Button>

      <Button
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(editor.isActive('italic') && 'bg-primary text-primary-foreground')}
        title="Italic (Cmd+I)"
      >
        <Italic size={16} />
      </Button>

      <Button
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(editor.isActive('underline') && 'bg-primary text-primary-foreground')}
        title="Underline (Cmd+U)"
      >
        <UnderlineIcon size={16} />
      </Button>

      <Button
        variant={editor.isActive('strike') ? 'default' : 'ghost'}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(editor.isActive('strike') && 'bg-primary text-primary-foreground')}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </Button>

      <div className="bubble-menu-divider" />

      <Button
        variant={editor.isActive('code') ? 'default' : 'ghost'}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={cn(editor.isActive('code') && 'bg-primary text-primary-foreground')}
        title="Inline Code (Cmd+E)"
      >
        <Code size={16} />
      </Button>

      <Button
        variant={editor.isActive('link') ? 'default' : 'ghost'}
        size="icon-sm"
        onClick={toggleLink}
        className={cn(editor.isActive('link') && 'bg-primary text-primary-foreground')}
        title="Add Link (Cmd+K)"
      >
        <Link size={16} />
      </Button>

      <Button
        variant={editor.isActive('highlight') ? 'default' : 'ghost'}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={cn(editor.isActive('highlight') && 'bg-primary text-primary-foreground')}
        title="Highlight"
      >
        <Highlighter size={16} />
      </Button>
    </div>
  )
}
