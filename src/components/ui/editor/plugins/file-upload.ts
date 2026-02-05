import { Paperclip, FileBox } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import type { EditorPlugin, SlashCommand, ToolbarAction } from '../types'
import { FileAttachment } from '../extensions/file-attachment'

// ============================================
// Preview Customization Types
// ============================================

/**
 * CSV/Spreadsheet preview options
 */
export interface CsvPreviewOptions {
  /** Maximum rows to display (default: 1000) */
  maxRows?: number
  /** Maximum columns to display (default: 50) */
  maxColumns?: number
  /** Show row numbers column (default: false) */
  showRowNumbers?: boolean
  /** Treat first row as header (default: true) */
  headerRow?: boolean
  /** CSV delimiter - 'auto' will detect (default: 'auto') */
  delimiter?: ',' | ';' | '\t' | '|' | 'auto'
  /** Strip whitespace from cells (default: true) */
  stripWhitespace?: boolean
  /** Placeholder for empty cells (default: '-') */
  emptyValuePlaceholder?: string
  /** Maximum width per cell in pixels (default: 300) */
  maxCellWidth?: number
  /** Enable text wrapping in cells (default: false) */
  wrapText?: boolean
  /** Freeze header row while scrolling (default: true) */
  freezeHeader?: boolean
  /** Alternate row colors for readability (default: true) */
  alternateRowColors?: boolean
  /** Custom cell formatter */
  formatCell?: (value: string, rowIndex: number, colIndex: number, header: string) => string
  /** Columns to highlight (by index or header name) */
  highlightColumns?: (number | string)[]
}

/**
 * Text/Code preview options
 */
export interface TextPreviewOptions {
  /** Maximum characters to display (default: 500000) */
  maxChars?: number
  /** Maximum lines to display (default: 10000) */
  maxLines?: number
  /** Show line numbers (default: false) */
  showLineNumbers?: boolean
  /** Enable word wrap (default: true) */
  wordWrap?: boolean
  /** Font size in pixels (default: 13) */
  fontSize?: number
  /** Tab size for indentation (default: 2) */
  tabSize?: number
}

/**
 * Image preview options
 */
export interface ImagePreviewOptions {
  /** Maximum width constraint (default: none) */
  maxWidth?: number
  /** Maximum height constraint (default: none) */
  maxHeight?: number
  /** Allow zoom controls (default: true) */
  allowZoom?: boolean
  /** Show image metadata (dimensions, size) (default: true) */
  showMetadata?: boolean
  /** Background color for transparent images (default: 'checkerboard') */
  transparentBackground?: 'checkerboard' | 'white' | 'black' | 'none'
}

/**
 * PDF preview options
 */
export interface PdfPreviewOptions {
  /** Show page controls (default: true) */
  showPageControls?: boolean
}

/**
 * Combined preview options
 */
export interface PreviewOptions {
  csv?: CsvPreviewOptions
  text?: TextPreviewOptions
  image?: ImagePreviewOptions
  pdf?: PdfPreviewOptions
}

/**
 * Display mode configuration by MIME type pattern
 * Patterns support wildcards like 'image/*'
 */
export type DisplayModeByType = Record<string, 'block' | 'inline'>

let uploadIdCounter = 0
function generateUploadId(): string {
  return `upload-${Date.now()}-${++uploadIdCounter}`
}

export interface FileUploadPluginOptions {
  /**
   * Handler for uploading files. Should return the URL of the uploaded file.
   */
  onUpload: (file: File) => Promise<string>

  /**
   * Accepted file types (MIME types or extensions).
   * @example ['image/*', 'application/pdf', '.doc', '.docx']
   */
  accept?: string[]

  /**
   * Maximum file size in bytes.
   * @default 10 * 1024 * 1024 (10MB)
   */
  maxSize?: number

  /**
   * Default display mode for uploaded files.
   * @default 'inline'
   */
  defaultDisplayMode?: 'block' | 'inline'

  /**
   * Custom file fetcher for preview. Use this when files are stored behind
   * authentication or need special handling to retrieve content.
   * Should return the file content as text or Blob.
   * @param src - The file URL/path stored in the attachment
   * @param mimeType - The MIME type of the file
   */
  onFetchFile?: (src: string, mimeType: string) => Promise<string | Blob>

  /**
   * Callback when upload starts.
   */
  onUploadStart?: (file: File) => void

  /**
   * Callback when upload completes successfully.
   */
  onUploadComplete?: (file: File, url: string) => void

  /**
   * Callback when upload fails.
   */
  onUploadError?: (file: File, error: Error) => void

  /**
   * Callback when a file is deleted from the editor.
   * Use this to clean up server-side resources.
   * @param src - The file URL
   * @param name - The file name
   * @param mimeType - The file MIME type
   */
  onFileDelete?: (src: string, name: string, mimeType: string) => void

  /**
   * Override default display mode for specific file types.
   * Keys are MIME type patterns (supports wildcards like 'image/*').
   * @example { 'image/*': 'block', 'application/pdf': 'block', 'text/*': 'inline' }
   */
  displayModeByType?: DisplayModeByType

  /**
   * Customize preview dialog behavior for different file types.
   */
  previewOptions?: PreviewOptions
}

function createFileInput(
  options: FileUploadPluginOptions,
  editor: Editor,
  displayMode: 'block' | 'inline',
): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true

  if (options.accept && options.accept.length > 0) {
    input.accept = options.accept.join(',')
  }

  input.onchange = async () => {
    const files = input.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      await uploadFile(file, options, editor, displayMode)
    }

    // Reset input for future use
    input.value = ''
  }

  return input
}

async function uploadFile(
  file: File,
  options: FileUploadPluginOptions,
  editor: Editor,
  requestedDisplayMode: 'block' | 'inline',
): Promise<void> {
  const maxSize = options.maxSize ?? 10 * 1024 * 1024 // 10MB default

  // Check file size
  if (file.size > maxSize) {
    const error = new Error(`File "${file.name}" exceeds the maximum size of ${formatSize(maxSize)}`)
    options.onUploadError?.(file, error)
    console.error(error.message)
    return
  }

  // Check file type if accept is specified
  if (options.accept && options.accept.length > 0) {
    const isAccepted = options.accept.some((pattern) => {
      if (pattern.startsWith('.')) {
        // Extension check
        return file.name.toLowerCase().endsWith(pattern.toLowerCase())
      }
      if (pattern.endsWith('/*')) {
        // Wildcard MIME type (e.g., 'image/*')
        const baseType = pattern.slice(0, -2)
        return file.type.startsWith(baseType)
      }
      // Exact MIME type match
      return file.type === pattern
    })

    if (!isAccepted) {
      const error = new Error(`File type "${file.type}" is not accepted`)
      options.onUploadError?.(file, error)
      console.error(error.message)
      return
    }
  }

  // Determine display mode before inserting placeholder
  const displayMode = getDisplayModeForType(file.type, options.displayModeByType, requestedDisplayMode)

  // Generate unique ID to find placeholder after async upload
  const uploadId = generateUploadId()

  // Insert placeholder immediately so user sees loading state
  const placeholderAttrs = {
    src: '',
    name: file.name,
    size: file.size,
    mimeType: file.type,
    uploading: true,
    uploadId,
  }

  if (displayMode === 'block') {
    editor.commands.setFileAttachmentBlock(placeholderAttrs)
  } else {
    editor.commands.setFileAttachment({
      ...placeholderAttrs,
      displayMode: 'inline',
    })
  }

  options.onUploadStart?.(file)

  try {
    const url = await options.onUpload(file)

    // Guard: editor may have been destroyed during the async upload
    if (editor.isDestroyed) return

    // Complete the upload: update placeholder with real URL
    editor.commands.completeFileUpload(uploadId, url)

    options.onUploadComplete?.(file, url)
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Upload failed')
    options.onUploadError?.(file, error)
    console.error('File upload failed:', error)

    // Remove the placeholder on failure
    if (!editor.isDestroyed) {
      editor.commands.failFileUpload(uploadId)
    }
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Determine display mode for a file based on its MIME type
 */
function getDisplayModeForType(
  mimeType: string,
  displayModeByType: DisplayModeByType | undefined,
  defaultMode: 'block' | 'inline',
): 'block' | 'inline' {
  if (!displayModeByType) return defaultMode

  // Check for exact match first
  if (displayModeByType[mimeType]) {
    return displayModeByType[mimeType]
  }

  // Check for wildcard patterns (e.g., 'image/*')
  for (const pattern of Object.keys(displayModeByType)) {
    if (pattern.endsWith('/*')) {
      const baseType = pattern.slice(0, -2)
      if (mimeType.startsWith(baseType + '/')) {
        return displayModeByType[pattern]
      }
    }
  }

  return defaultMode
}

function setupClipboardPaste(editor: Editor, options: FileUploadPluginOptions): () => void {
  const handlePaste = async (event: ClipboardEvent) => {
    const files = event.clipboardData?.files
    if (!files || files.length === 0) return

    // Only handle if clipboard contains files (screenshots, copied images)
    // Let normal text paste pass through
    const hasFiles = Array.from(files).some((file) => file.type.length > 0)
    if (!hasFiles) return

    event.preventDefault()
    event.stopPropagation()

    const defaultMode = options.defaultDisplayMode ?? 'inline'

    for (const file of Array.from(files)) {
      if (!file.type) continue

      const displayMode = getDisplayModeForType(file.type, options.displayModeByType, defaultMode)
      await uploadFile(file, options, editor, displayMode)
    }
  }

  const editorElement = editor.view.dom
  editorElement.addEventListener('paste', handlePaste)

  return () => {
    editorElement.removeEventListener('paste', handlePaste)
  }
}

function setupDragAndDrop(editor: Editor, options: FileUploadPluginOptions): () => void {
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const files = event.dataTransfer?.files
    if (!files || files.length === 0) return

    const defaultMode = options.defaultDisplayMode ?? 'inline'

    for (const file of Array.from(files)) {
      // Determine display mode based on file type
      const displayMode = getDisplayModeForType(file.type, options.displayModeByType, defaultMode)
      await uploadFile(file, options, editor, displayMode)
    }
  }

  const editorElement = editor.view.dom

  editorElement.addEventListener('dragover', handleDragOver)
  editorElement.addEventListener('drop', handleDrop)

  return () => {
    editorElement.removeEventListener('dragover', handleDragOver)
    editorElement.removeEventListener('drop', handleDrop)
  }
}

export function createFileUploadPlugin(options: FileUploadPluginOptions): EditorPlugin {
  let fileInputInline: HTMLInputElement | null = null
  let fileInputBlock: HTMLInputElement | null = null
  let cleanupDragAndDrop: (() => void) | null = null
  let cleanupClipboardPaste: (() => void) | null = null

  const triggerInlineUpload = (editor: Editor) => {
    if (!fileInputInline) {
      fileInputInline = createFileInput(options, editor, 'inline')
    }
    fileInputInline.click()
  }

  const triggerBlockUpload = (editor: Editor) => {
    if (!fileInputBlock) {
      fileInputBlock = createFileInput(options, editor, 'block')
    }
    fileInputBlock.click()
  }

  // Default upload uses the configured default display mode
  const triggerDefaultUpload = (editor: Editor) => {
    const displayMode = options.defaultDisplayMode ?? 'inline'
    if (displayMode === 'block') {
      triggerBlockUpload(editor)
    } else {
      triggerInlineUpload(editor)
    }
  }

  const slashCommands: SlashCommand[] = [
    {
      name: 'File',
      description: 'Inline file attachment',
      icon: Paperclip,
      aliases: ['file', 'upload', 'attachment', 'attach', 'inline'],
      group: 'media',
      action: triggerInlineUpload,
    },
    {
      name: 'File Card',
      description: 'File attachment as card/block',
      icon: FileBox,
      aliases: ['filecard', 'fileblock', 'card', 'block'],
      group: 'media',
      action: triggerBlockUpload,
    },
  ]

  const toolbarAction: ToolbarAction = {
    id: 'file-upload',
    icon: Paperclip,
    label: 'Upload file',
    action: triggerDefaultUpload,
  }

  return {
    name: 'file-upload',
    slashCommands,
    toolbarActions: [toolbarAction],
    extensions: [
      FileAttachment.configure({
        onFetchFile: options.onFetchFile,
        previewOptions: options.previewOptions,
        onFileDelete: options.onFileDelete,
      }),
    ],
    onInit: (editor) => {
      // Create file inputs for this editor
      fileInputInline = createFileInput(options, editor, 'inline')
      fileInputBlock = createFileInput(options, editor, 'block')
      // Setup drag and drop
      cleanupDragAndDrop = setupDragAndDrop(editor, options)
      // Setup clipboard paste (screenshots, copied images)
      cleanupClipboardPaste = setupClipboardPaste(editor, options)
    },
    onDestroy: () => {
      // Cleanup file inputs
      if (fileInputInline) {
        fileInputInline.remove()
        fileInputInline = null
      }
      if (fileInputBlock) {
        fileInputBlock.remove()
        fileInputBlock = null
      }
      // Cleanup drag and drop
      if (cleanupDragAndDrop) {
        cleanupDragAndDrop()
        cleanupDragAndDrop = null
      }
      // Cleanup clipboard paste
      if (cleanupClipboardPaste) {
        cleanupClipboardPaste()
        cleanupClipboardPaste = null
      }
    },
  }
}
