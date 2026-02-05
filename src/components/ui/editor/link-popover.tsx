import { useState, useCallback, useRef, useLayoutEffect, useId } from 'react'
import type { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Link, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkPopoverContentProps {
  editor: Editor
  onClose: () => void
}

// Focus delay for inputs after popover opens
const INPUT_FOCUS_DELAY_MS = 50

export function LinkPopoverContent({ editor, onClose }: LinkPopoverContentProps) {
  // Get initial values from editor state
  const getInitialValues = useCallback(() => {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    const linkMark = editor.getAttributes('link')
    return {
      text: selectedText || '',
      url: (linkMark.href as string) || '',
    }
  }, [editor])

  const initialValues = getInitialValues()
  const [text, setText] = useState(initialValues.text)
  const [url, setUrl] = useState(initialValues.url)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const instanceId = useId()
  const textInputId = `link-text-${instanceId}`
  const urlInputId = `link-url-${instanceId}`

  // Focus appropriate input after mount
  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      if (initialValues.text) {
        urlInputRef.current?.focus()
        urlInputRef.current?.select()
      } else {
        textInputRef.current?.focus()
      }
    }, INPUT_FOCUS_DELAY_MS)
    return () => clearTimeout(timer)
  }, [initialValues.text])

  const handleSubmit = useCallback(() => {
    if (!url) {
      onClose()
      return
    }

    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')

    if (text && text !== selectedText) {
      // Text was modified - delete selection and insert new text with link
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent({
          type: 'text',
          text: text,
          marks: [{ type: 'link', attrs: { href: url } }],
        })
        .run()
    } else if (text) {
      // Apply link to existing text
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else {
      // No text - insert URL as both text and link
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: url,
          marks: [{ type: 'link', attrs: { href: url } }],
        })
        .run()
    }

    onClose()
  }, [editor, text, url, onClose])

  const handleRemoveLink = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    onClose()
  }, [editor, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [handleSubmit, onClose],
  )

  const isEditing = editor.isActive('link')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={textInputId} className="text-xs font-medium text-muted-foreground">
          Text
        </label>
        <input
          ref={textInputRef}
          id={textInputId}
          type="text"
          placeholder="Link text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={urlInputId} className="text-xs font-medium text-muted-foreground">
          URL
        </label>
        <input
          ref={urlInputRef}
          id={urlInputId}
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        {isEditing ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleRemoveLink}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={12} className="mr-1" />
            Remove
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-1.5">
          <Button type="button" variant="ghost" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" size="xs" onClick={handleSubmit} disabled={!url}>
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Self-contained button with popover for toolbar use
interface LinkPopoverButtonProps {
  editor: Editor
  variant?: 'toolbar' | 'bubble'
  className?: string
}

export function LinkPopoverButton({ editor, variant = 'toolbar', className }: LinkPopoverButtonProps) {
  const [open, setOpen] = useState(false)

  const isEditing = editor.isActive('link')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant={isEditing ? 'default' : 'ghost'}
            size={variant === 'toolbar' ? 'icon-sm' : 'icon-sm'}
            className={cn(isEditing && 'bg-primary text-primary-foreground', className)}
            title="Add/Edit link"
            type="button"
            onPointerDown={(e) => {
              // Prevent editor from losing focus
              e.preventDefault()
            }}
          >
            <Link size={16} />
          </Button>
        }
      />
      <PopoverContent side="bottom" align="start" sideOffset={8} className="w-80">
        <LinkPopoverContent editor={editor} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

// Floating modal that can be triggered programmatically (for slash commands)
interface FloatingLinkPopoverProps {
  editor: Editor
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FloatingLinkPopover({ editor, open, onOpenChange }: FloatingLinkPopoverProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => onOpenChange(false)} />
      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add link"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md w-80 animate-in fade-in-0 zoom-in-95"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <LinkPopoverContent editor={editor} onClose={() => onOpenChange(false)} />
      </div>
    </>
  )
}
