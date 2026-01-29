import { useEditor, EditorContent } from '@tiptap/react'
import { createExtensions } from './extensions'
import { FileAttachment } from './extensions/file-attachment'
import type { RichTextViewerProps } from './types'
import { cn } from '@/lib/utils'
import './editor.css'

/**
 * Lightweight read-only viewer for displaying rich text content.
 * Renders content without editing UI (no bubble menu, no slash commands).
 */
export function RichTextViewer({ content, className }: RichTextViewerProps) {
  const editor = useEditor({
    extensions: [
      ...createExtensions(),
      FileAttachment, // Include file attachment support for viewing
    ],
    content: typeof content === 'string' ? content : content,
    editable: false,
  })

  if (!editor) {
    return null
  }

  return (
    <div
      className={cn('rich-text-editor', className)}
      data-editable="false"
    >
      <EditorContent editor={editor} />
    </div>
  )
}
