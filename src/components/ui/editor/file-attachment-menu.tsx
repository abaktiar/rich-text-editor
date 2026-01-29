import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  LayoutList,
  CreditCard,
  Maximize2,
  Eye,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FileDisplayMode, FileAlignment } from './extensions/file-attachment'

export interface FileAttachmentMenuProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
  position: { top: number; left: number }
  displayMode: FileDisplayMode
  alignment: FileAlignment
  width: number | null
  isImage: boolean
  onPreview: () => void
  onDelete: () => void
  updateAttributes: (attrs: Record<string, unknown>) => void
}

const IMAGE_SIZES = [
  { label: 'S', width: 200 },
  { label: 'M', width: 400 },
  { label: 'L', width: 600 },
  { label: 'Full', width: null },
]

export function FileAttachmentMenu({
  editor,
  isOpen,
  onClose,
  position,
  displayMode,
  alignment,
  width,
  isImage,
  onPreview,
  onDelete,
  updateAttributes,
}: FileAttachmentMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Delay adding listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleDisplayModeChange = useCallback((mode: FileDisplayMode) => {
    updateAttributes({ displayMode: mode })
  }, [updateAttributes])

  const handleAlignmentChange = useCallback((align: FileAlignment) => {
    updateAttributes({ alignment: align })
  }, [updateAttributes])

  const handleWidthChange = useCallback((newWidth: number | null) => {
    updateAttributes({ width: newWidth })
  }, [updateAttributes])

  if (!isOpen || !editor.isEditable) return null

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        'file-attachment-menu',
        'fixed z-50',
        'bg-popover border border-border rounded-lg shadow-lg',
        'p-1.5',
        'animate-in fade-in zoom-in-95 duration-150'
      )}
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-0.5">
        {/* Display Mode Toggle */}
        <div className="flex items-center border-r border-border pr-1.5 mr-1">
          <Button
            variant={displayMode === 'inline' ? 'default' : 'ghost'}
            size="icon-xs"
            onClick={() => handleDisplayModeChange('inline')}
            title="Inline view"
            className={cn(
              'h-7 w-7',
              displayMode === 'inline' && 'bg-primary text-primary-foreground'
            )}
          >
            <LayoutList size={14} />
          </Button>
          <Button
            variant={displayMode === 'block' ? 'default' : 'ghost'}
            size="icon-xs"
            onClick={() => handleDisplayModeChange('block')}
            title="Card view"
            className={cn(
              'h-7 w-7',
              displayMode === 'block' && 'bg-primary text-primary-foreground'
            )}
          >
            <CreditCard size={14} />
          </Button>
        </div>

        {/* Image-specific options */}
        {isImage && displayMode === 'block' && (
          <>
            {/* Alignment */}
            <div className="flex items-center border-r border-border pr-1.5 mr-1">
              <Button
                variant={alignment === 'left' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => handleAlignmentChange('left')}
                title="Align left"
                className={cn(
                  'h-7 w-7',
                  alignment === 'left' && 'bg-primary text-primary-foreground'
                )}
              >
                <AlignLeft size={14} />
              </Button>
              <Button
                variant={alignment === 'center' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => handleAlignmentChange('center')}
                title="Align center"
                className={cn(
                  'h-7 w-7',
                  alignment === 'center' && 'bg-primary text-primary-foreground'
                )}
              >
                <AlignCenter size={14} />
              </Button>
              <Button
                variant={alignment === 'right' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => handleAlignmentChange('right')}
                title="Align right"
                className={cn(
                  'h-7 w-7',
                  alignment === 'right' && 'bg-primary text-primary-foreground'
                )}
              >
                <AlignRight size={14} />
              </Button>
            </div>

            {/* Size Options */}
            <div className="flex items-center border-r border-border pr-1.5 mr-1 gap-0.5">
              {IMAGE_SIZES.map((size) => (
                <Button
                  key={size.label}
                  variant={width === size.width ? 'default' : 'ghost'}
                  size="icon-xs"
                  onClick={() => handleWidthChange(size.width)}
                  title={size.width ? `${size.width}px` : 'Full width'}
                  className={cn(
                    'h-7 w-7 text-xs font-medium',
                    width === size.width && 'bg-primary text-primary-foreground'
                  )}
                >
                  {size.label === 'Full' ? (
                    <Maximize2 size={14} />
                  ) : (
                    size.label
                  )}
                </Button>
              ))}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onPreview}
            title="Preview"
            className="h-7 w-7"
          >
            <Eye size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDelete}
            title="Delete"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
