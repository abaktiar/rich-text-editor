import { useEffect, useMemo, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { createExtensions } from './extensions'
import { FileAttachment } from './extensions/file-attachment'
import { MentionExtension } from './extensions/mention-extension'
import type { RichTextViewerProps } from './types'
import { cn } from '@/lib/utils'
import './editor.css'

// Helper to format CSS value (adds 'px' if number)
const formatCssValue = (value: string | number | undefined): string | undefined => {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

/**
 * Lightweight read-only viewer for displaying rich text content.
 * Renders content without editing UI (no bubble menu, no slash commands).
 */
export function RichTextViewer({ content, className, onMentionClick, codeBlockMaxHeight }: RichTextViewerProps) {
  const extensions = useMemo(
    () => [
      ...createExtensions(),
      FileAttachment, // Include file attachment support for viewing
      MentionExtension.configure({
        onMentionClick,
      }),
    ],
    [onMentionClick],
  )

  const editor = useEditor({
    extensions,
    content: typeof content === 'string' ? content : content,
    editable: false,
    immediatelyRender: true,
  })

  // Track whether this is the initial mount to avoid unnecessary setContent on first render
  const isInitialMount = useRef(true)

  // Sync content prop changes to the editor (useEditor only uses content on creation)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const newContent = typeof content === 'string' ? content : content
    editor.commands.setContent(newContent ?? '')
  }, [editor, content])

  if (!editor) {
    return null
  }

  // Build style object with CSS custom properties
  const viewerStyle = {
    '--code-block-max-height': formatCssValue(codeBlockMaxHeight),
  } as React.CSSProperties

  return (
    <div className={cn('rich-text-editor', className)} data-editable="false" style={viewerStyle}>
      <EditorContent editor={editor} />
    </div>
  )
}
