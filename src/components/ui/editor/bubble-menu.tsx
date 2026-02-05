import { useEffect, useState, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Highlighter, Link } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LinkPopoverContent } from './link-popover'

// Offset from selection to position bubble menu above text
const BUBBLE_MENU_OFFSET_Y = 50

interface BubbleMenuProps {
  editor: Editor
}

export function BubbleMenu({ editor }: BubbleMenuProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [showLinkPopover, setShowLinkPopover] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const linkPopoverOpenRef = useRef(false)

  // Track link popover state in ref for blur handler
  useEffect(() => {
    linkPopoverOpenRef.current = showLinkPopover
  }, [showLinkPopover])

  const updatePosition = useCallback(() => {
    // Don't hide if link popover is open
    if (linkPopoverOpenRef.current) return

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
    const top = start.top - BUBBLE_MENU_OFFSET_Y

    setPosition({ top, left })
    setIsVisible(true)
  }, [editor])

  const handleBlur = useCallback(() => {
    // Don't hide if link popover is open
    if (linkPopoverOpenRef.current) return
    setIsVisible(false)
  }, [])

  useEffect(() => {
    editor.on('selectionUpdate', updatePosition)
    editor.on('blur', handleBlur)

    return () => {
      editor.off('selectionUpdate', updatePosition)
      editor.off('blur', handleBlur)
    }
  }, [editor, updatePosition, handleBlur])

  // Close link popover and refocus editor
  const handleLinkPopoverClose = useCallback(() => {
    setShowLinkPopover(false)
    editor.chain().focus().run()
  }, [editor])

  if (!isVisible) {
    return null
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
      {showLinkPopover ? (
        <div className="p-1">
          <LinkPopoverContent editor={editor} onClose={handleLinkPopoverClose} />
        </div>
      ) : (
        <>
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
            onClick={() => setShowLinkPopover(true)}
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
        </>
      )}
    </div>
  )
}
