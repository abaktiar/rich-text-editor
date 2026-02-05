import { useState, useRef, useCallback, useEffect } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import {
  FileText,
  Image as ImageIcon,
  File,
  Trash2,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FilePreviewDialog } from './file-preview-dialog'
import { FileAttachmentMenu } from './file-attachment-menu'
import type {
  FileDisplayMode,
  FileAlignment,
  FileFetcher,
  PreviewOptions,
  FileDeleteHandler,
} from './extensions/file-attachment'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileIconType(mimeType: string): 'image' | 'text' | 'spreadsheet' | 'archive' | 'code' | 'generic' {
  if (mimeType.startsWith('image/')) {
    return 'image'
  }
  if (mimeType.startsWith('text/') || mimeType.includes('document')) {
    return 'text'
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
    return 'spreadsheet'
  }
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) {
    return 'archive'
  }
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) {
    return 'code'
  }
  return 'generic'
}

const iconMap: Record<ReturnType<typeof getFileIconType>, LucideIcon> = {
  image: ImageIcon,
  text: FileText,
  spreadsheet: FileSpreadsheet,
  archive: FileArchive,
  code: FileCode,
  generic: File,
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

function FileIcon({ mimeType, size, className }: { mimeType: string; size: number; className?: string }) {
  const iconType = getFileIconType(mimeType)
  const Icon = iconMap[iconType]
  return <Icon size={size} className={className} />
}

// Minimum and maximum dimensions for resizing
const MIN_WIDTH = 100
const MAX_WIDTH = 1200

export function FileAttachmentComponent({ node, deleteNode, editor, updateAttributes, selected }: NodeViewProps) {
  const { src, name, size, mimeType, displayMode, alignment, width, uploading } = node.attrs as {
    src: string
    name: string
    size: number
    mimeType: string
    displayMode: FileDisplayMode
    alignment: FileAlignment
    width: number | null
    uploading: boolean
  }
  const isEditable = editor.isEditable
  const isSelected = selected && isEditable

  // Get custom file fetcher, preview options, and delete handler from extension storage
  const storage = editor.storage as unknown as Record<
    string,
    {
      onFetchFile?: FileFetcher
      previewOptions?: PreviewOptions
      onFileDelete?: FileDeleteHandler
    }
  >
  const onFetchFile = storage.fileAttachment?.onFetchFile
  const previewOptions = storage.fileAttachment?.previewOptions
  const onFileDelete = storage.fileAttachment?.onFileDelete
  const isImage = isImageType(mimeType)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [currentWidth, setCurrentWidth] = useState<number | null>(width)
  const elementRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null)

  // Sync currentWidth with props
  useEffect(() => {
    setCurrentWidth(width)
  }, [width])

  const handleDelete = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      if (uploading) return
      // Call the delete handler for cleanup (e.g., delete from server)
      onFileDelete?.(src, name, mimeType)
      deleteNode()
    },
    [deleteNode, onFileDelete, src, name, mimeType, uploading],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()

      if (uploading || isResizing) return

      if (!isEditable) {
        // In view mode, directly open preview
        setIsPreviewOpen(true)
        return
      }

      // In edit mode, show the floating menu
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setMenuPosition({
        top: rect.top - 45, // Position above the element
        left: rect.left + rect.width / 2,
      })
      setIsMenuOpen(true)
    },
    [isEditable, isResizing, uploading],
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (uploading || isResizing) return
      setIsMenuOpen(false)
      setIsPreviewOpen(true)
    },
    [isResizing, uploading],
  )

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  const handlePreview = useCallback(() => {
    setIsMenuOpen(false)
    setIsPreviewOpen(true)
  }, [])

  // Resize handlers for images
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditable || !isImage || uploading) return
      e.preventDefault()
      e.stopPropagation()

      const currentElement = imageRef.current || elementRef.current
      if (!currentElement) return

      const rect = currentElement.getBoundingClientRect()
      resizeStartRef.current = {
        x: e.clientX,
        width: rect.width,
      }
      setIsResizing(true)
    },
    [isEditable, isImage, uploading],
  )

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizeStartRef.current) return

    const deltaX = e.clientX - resizeStartRef.current.x
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStartRef.current.width + deltaX))
    setCurrentWidth(newWidth)
  }, [])

  const handleResizeEnd = useCallback(() => {
    if (resizeStartRef.current && currentWidth) {
      updateAttributes({ width: Math.round(currentWidth) })
    }
    resizeStartRef.current = null
    setIsResizing(false)
  }, [currentWidth, updateAttributes])

  // Add/remove resize event listeners
  useEffect(() => {
    if (isResizing) {
      // Add cursor style to body for smooth resize experience
      document.body.style.cursor = 'se-resize'
      document.body.style.userSelect = 'none'

      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  // Calculate width style for images
  const getWidthStyle = () => {
    if (!isImage) return {}
    if (currentWidth) return { width: `${currentWidth}px`, maxWidth: '100%' }
    return { maxWidth: '100%' }
  }

  // Image display (block mode) - show image directly
  if (isImage && displayMode === 'block') {
    return (
      <NodeViewWrapper
        className={cn(
          'file-attachment-image-wrapper',
          alignment === 'center' && 'flex justify-center',
          alignment === 'right' && 'flex justify-end',
        )}
        ref={elementRef}
      >
        <div
          className={cn(
            'file-attachment-image-container',
            'relative inline-block',
            'group',
            isResizing && 'select-none',
            uploading && 'file-attachment-uploading',
          )}
          style={getWidthStyle()}
        >
          {uploading ? (
            <div
              className={cn(
                'rounded-lg bg-muted flex flex-col items-center justify-center gap-2',
                'border border-dashed border-border',
              )}
              style={{ width: currentWidth ?? 300, height: (currentWidth ?? 300) * 0.56, maxWidth: '100%' }}
            >
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate max-w-[200px] px-2">{name}</span>
              <span className="text-[11px] text-muted-foreground/60">Uploading...</span>
            </div>
          ) : (
            <>
              <img
                ref={imageRef}
                src={src}
                alt={name}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                className={cn(
                  'file-attachment-image',
                  'rounded-lg cursor-pointer',
                  'transition-all duration-150',
                  isEditable && 'hover:shadow-lg',
                  isMenuOpen && 'ring-2 ring-primary ring-offset-2',
                  isSelected && 'ring-2 ring-primary ring-offset-2 shadow-lg',
                )}
                style={{ width: '100%', height: 'auto' }}
                title={isEditable ? 'Click for options, double-click to preview' : `Click to view: ${name}`}
                draggable={false}
              />

              {/* Resize handle */}
              {isEditable && (
                <div
                  className={cn(
                    'image-resize-handle',
                    'absolute -bottom-2 -right-2 w-6 h-6',
                    'cursor-se-resize',
                    'opacity-0 group-hover:opacity-100',
                    'transition-opacity',
                    'flex items-center justify-center',
                    isResizing && 'image-resize-handle-active opacity-100',
                  )}
                  onMouseDown={handleResizeStart}
                  title="Drag to resize"
                >
                  <div className="image-resize-handle-inner" />
                </div>
              )}

              {/* Quick delete button */}
              {isEditable && !isMenuOpen && (
                <Button
                  variant="secondary"
                  size="icon-xs"
                  onClick={handleDelete}
                  title="Delete"
                  className={cn(
                    'absolute top-2 right-2',
                    'opacity-0 group-hover:opacity-100',
                    'transition-opacity',
                    'bg-background/80 backdrop-blur-sm',
                    'hover:bg-destructive hover:text-destructive-foreground',
                  )}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </>
          )}
        </div>

        {!uploading && (
          <>
            <FileAttachmentMenu
              editor={editor}
              isOpen={isMenuOpen}
              onClose={handleMenuClose}
              position={menuPosition}
              displayMode={displayMode}
              alignment={alignment}
              width={currentWidth}
              isImage={isImage}
              onPreview={handlePreview}
              onDelete={handleDelete}
              updateAttributes={updateAttributes}
            />

            <FilePreviewDialog
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              src={src}
              name={name}
              size={size}
              mimeType={mimeType}
              onFetchFile={onFetchFile}
              previewOptions={previewOptions}
            />
          </>
        )}
      </NodeViewWrapper>
    )
  }

  // Inline mode for all files (including images)
  if (displayMode === 'inline') {
    return (
      <NodeViewWrapper as="span" className="file-attachment-inline-wrapper" ref={elementRef}>
        <span
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={cn(
            'file-attachment-inline',
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md',
            'bg-muted text-sm font-medium',
            'border border-border',
            'transition-all duration-150',
            'select-none',
            'align-middle',
            uploading
              ? 'file-attachment-uploading border-dashed cursor-default'
              : cn(
                  'cursor-pointer',
                  isEditable ? 'hover:bg-accent hover:border-primary/30' : 'hover:bg-accent',
                  isMenuOpen && 'bg-accent border-primary/50',
                  isSelected && 'ring-2 ring-primary ring-offset-1 bg-accent border-primary/50',
                ),
          )}
          title={
            uploading
              ? `Uploading ${name}...`
              : isEditable
                ? 'Click for options, double-click to preview'
                : `Click to preview: ${name}`
          }
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin text-muted-foreground shrink-0" />
          ) : isImage ? (
            <img src={src} alt={name} className="w-4 h-4 rounded object-cover shrink-0" />
          ) : (
            <FileIcon mimeType={mimeType} size={14} className="text-muted-foreground shrink-0" />
          )}
          <span className="truncate max-w-[150px]">{name}</span>
          <span className="text-muted-foreground text-xs">
            {uploading ? 'Uploading...' : `(${formatFileSize(size)})`}
          </span>
          {isEditable && !isMenuOpen && !uploading && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleDelete}
              title="Delete"
              className="h-5 w-5 ml-0.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={12} />
            </Button>
          )}
        </span>

        {!uploading && (
          <>
            <FileAttachmentMenu
              editor={editor}
              isOpen={isMenuOpen}
              onClose={handleMenuClose}
              position={menuPosition}
              displayMode={displayMode}
              alignment={alignment}
              width={width}
              isImage={isImage}
              onPreview={handlePreview}
              onDelete={handleDelete}
              updateAttributes={updateAttributes}
            />

            <FilePreviewDialog
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              src={src}
              name={name}
              size={size}
              mimeType={mimeType}
              onFetchFile={onFetchFile}
              previewOptions={previewOptions}
            />
          </>
        )}
      </NodeViewWrapper>
    )
  }

  // Block/Card mode for non-images
  return (
    <NodeViewWrapper
      className={cn(
        'file-attachment-block-wrapper',
        alignment === 'center' && 'flex justify-center',
        alignment === 'right' && 'flex justify-end',
      )}
      data-drag-handle={!uploading ? '' : undefined}
      ref={elementRef}
    >
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          'file-attachment-block',
          'flex items-center gap-3 p-3 rounded-lg',
          'bg-muted/50 border border-border',
          'transition-all duration-150',
          'select-none',
          uploading
            ? 'file-attachment-uploading border-dashed cursor-default'
            : cn(
                'cursor-pointer',
                isEditable ? 'hover:bg-muted hover:border-primary/30 hover:shadow-sm' : 'hover:bg-muted',
                isMenuOpen && 'bg-muted border-primary/50 shadow-sm',
                isSelected && 'ring-2 ring-primary ring-offset-2 bg-muted border-primary/50 shadow-sm',
              ),
        )}
        style={{ maxWidth: '400px' }}
        title={
          uploading
            ? `Uploading ${name}...`
            : isEditable
              ? 'Click for options, double-click to preview'
              : `Click to preview: ${name}`
        }
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          {uploading ? (
            <Loader2 size={28} className="animate-spin text-primary" />
          ) : (
            <FileIcon mimeType={mimeType} size={28} className="text-primary" />
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" title={name}>
            {name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {uploading ? 'Uploading...' : formatFileSize(size)}
          </div>
          <div className="text-xs text-muted-foreground/70 truncate">{mimeType || 'Unknown type'}</div>
        </div>

        {/* Delete Action */}
        {isEditable && !isMenuOpen && !uploading && (
          <div className="shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              title="Delete"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      </div>

      {!uploading && (
        <>
          <FileAttachmentMenu
            editor={editor}
            isOpen={isMenuOpen}
            onClose={handleMenuClose}
            position={menuPosition}
            displayMode={displayMode}
            alignment={alignment}
            width={width}
            isImage={isImage}
            onPreview={handlePreview}
            onDelete={handleDelete}
            updateAttributes={updateAttributes}
          />

          <FilePreviewDialog
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            src={src}
            name={name}
            size={size}
            mimeType={mimeType}
          />
        </>
      )}
    </NodeViewWrapper>
  )
}
