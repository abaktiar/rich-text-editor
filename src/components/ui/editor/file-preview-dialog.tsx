import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Download,
  FileText,
  File,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'


// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// ============================================
// Preview Options Types
// ============================================

export type FileFetcher = (src: string, mimeType: string) => Promise<string | Blob>

export interface CsvPreviewOptions {
  showRowNumbers?: boolean
  headerRow?: boolean
  delimiter?: ',' | ';' | '\t' | '|' | 'auto'
  stripWhitespace?: boolean
  emptyValuePlaceholder?: string
  wrapText?: boolean
  alternateRowColors?: boolean
  formatCell?: (value: string, rowIndex: number, colIndex: number, header: string) => string
  highlightColumns?: (number | string)[]
}

export interface TextPreviewOptions {
  showLineNumbers?: boolean
  wordWrap?: boolean
  fontSize?: number
  tabSize?: number
}

export interface ImagePreviewOptions {
  maxWidth?: number
  maxHeight?: number
  allowZoom?: boolean
  showMetadata?: boolean
  transparentBackground?: 'checkerboard' | 'white' | 'black' | 'none'
}

export interface PdfPreviewOptions {
  showPageControls?: boolean
}

export interface PreviewOptions {
  csv?: CsvPreviewOptions
  text?: TextPreviewOptions
  image?: ImagePreviewOptions
  pdf?: PdfPreviewOptions
}

export interface FilePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  src: string
  name: string
  size: number
  mimeType: string
  onFetchFile?: FileFetcher
  previewOptions?: PreviewOptions
}

// ============================================
// Default Options
// ============================================

const DEFAULT_CSV_OPTIONS: Required<Omit<CsvPreviewOptions, 'formatCell' | 'highlightColumns'>> = {
  showRowNumbers: true,
  headerRow: true,
  delimiter: 'auto',
  stripWhitespace: true,
  emptyValuePlaceholder: '',
  wrapText: false,
  alternateRowColors: true,
}

const DEFAULT_TEXT_OPTIONS: Required<TextPreviewOptions> = {
  showLineNumbers: true,
  wordWrap: false,
  fontSize: 13,
  tabSize: 2,
}

const DEFAULT_IMAGE_OPTIONS: Required<ImagePreviewOptions> = {
  maxWidth: 0,
  maxHeight: 0,
  allowZoom: true,
  showMetadata: true,
  transparentBackground: 'checkerboard',
}

// ============================================
// Utility Functions
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileIconType(
  mimeType: string,
): 'image' | 'video' | 'text' | 'spreadsheet' | 'archive' | 'code' | 'generic' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('text/') || mimeType.includes('document')) return 'text'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet'
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return 'archive'
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return 'code'
  return 'generic'
}

const iconMap: Record<ReturnType<typeof getFileIconType>, LucideIcon> = {
  image: ImageIcon,
  video: Video,
  text: FileText,
  spreadsheet: FileSpreadsheet,
  archive: FileArchive,
  code: FileCode,
  generic: File,
}

function canPreview(mimeType: string): boolean {
  if (mimeType.startsWith('image/')) return true
  if (mimeType.startsWith('video/')) return true
  if (mimeType.startsWith('text/')) return true
  if (mimeType === 'application/json') return true
  if (mimeType === 'text/csv' || mimeType === 'application/csv') return true
  if (mimeType === 'application/pdf') return true
  return false
}

function isTextBased(mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml' ||
    mimeType === 'application/javascript'
  )
}

function isCsv(mimeType: string, name: string): boolean {
  return mimeType === 'text/csv' || mimeType === 'application/csv' || name.toLowerCase().endsWith('.csv')
}

function isJson(mimeType: string, name: string): boolean {
  return mimeType === 'application/json' || name.toLowerCase().endsWith('.json')
}

function detectDelimiter(content: string): ',' | ';' | '\t' | '|' {
  const firstLines = content.split('\n').slice(0, 5).join('\n')
  const counts = {
    ',': (firstLines.match(/,/g) || []).length,
    ';': (firstLines.match(/;/g) || []).length,
    '\t': (firstLines.match(/\t/g) || []).length,
    '|': (firstLines.match(/\|/g) || []).length,
  }

  const max = Math.max(...Object.values(counts))
  if (max === 0) return ','

  for (const [delim, count] of Object.entries(counts)) {
    if (count === max) return delim as ',' | ';' | '\t' | '|'
  }
  return ','
}

// Max rows to parse for large CSVs to avoid memory issues
const CSV_MAX_ROWS = 100_000

function parseCSV(text: string, delimiter: string, stripWhitespace: boolean): { data: string[][]; truncated: boolean; totalLines: number } {
  const lines = text.split('\n').filter(line => line.trim())
  const totalLines = lines.length
  const truncated = totalLines > CSV_MAX_ROWS
  const linesToParse = truncated ? lines.slice(0, CSV_MAX_ROWS) : lines

  const data = linesToParse.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(stripWhitespace ? current.trim() : current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(stripWhitespace ? current.trim() : current)
    return result
  })

  return { data, truncated, totalLines }
}

// ============================================
// Download Progress State
// ============================================

interface DownloadProgress {
  loaded: number
  total: number | null
  percentage: number
}

// ============================================
// CSV Viewer Component with Virtualization
// ============================================

interface CsvViewerProps {
  content: string
  options?: CsvPreviewOptions
}

function CsvViewer({ content, options }: CsvViewerProps) {
  const opts = { ...DEFAULT_CSV_OPTIONS, ...options }
  const [hasHeader, setHasHeader] = useState(opts.headerRow)
  const parentRef = useRef<HTMLDivElement>(null)

  const delimiter = opts.delimiter === 'auto' ? detectDelimiter(content) : opts.delimiter
  const parsed = useMemo(
    () => parseCSV(content, delimiter, opts.stripWhitespace),
    [content, delimiter, opts.stripWhitespace],
  )
  const { data, truncated, totalLines } = parsed

  const headers = useMemo(() => {
    if (data.length === 0) return []
    return hasHeader ? data[0] : data[0].map((_, i) => `Column ${i + 1}`)
  }, [data, hasHeader])

  const rows = useMemo(() => {
    if (data.length === 0) return []
    return hasHeader ? data.slice(1) : data
  }, [data, hasHeader])

  const highlightIndices = useMemo(() => {
    if (!opts.highlightColumns || !headers.length) return new Set<number>()
    return new Set(
      opts.highlightColumns
        .map((col) => {
          if (typeof col === 'number') return col
          return headers.indexOf(col)
        })
        .filter((i) => i >= 0),
    )
  }, [opts.highlightColumns, headers])

  // Calculate column widths based on content
  const columnWidths = useMemo(;() => {
    if (data.length === 0) return []
    // Use reduce instead of Math.max(...spread) to avoid call stack overflow on large datasets
    const maxCols = data.reduce((max, row) => Math.max(max, row.length), 0)
    const widths: number[] = []

    for (let col = 0; col < maxCols; col++) {
      let maxWidth = headers[col]?.length || 10
      // Sample first 100 rows for performance
      const sampleRows = rows.slice(0, 100)
      for (const row of sampleRows) {
        const cellLength = row[col]?.length || 0
        maxWidth = Math.max(maxWidth, cellLength)
      }
      // Clamp between 60px and 400px, roughly 8px per character
      widths.push(Math.min(400, Math.max(60, maxWidth * 8 + 24)))
    }
    return widths
  }, [data, headers, rows])

  const totalWidth = useMemo(() => {
    return (opts.showRowNumbers ? 56 : 0) + columnWidths.reduce((sum, w) => sum + w, 0)
  }, [columnWidths, opts.showRowNumbers])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 20,
  })

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data in CSV file</div>
  }

  const formatCellValue = (value: string, rowIdx: number, colIdx: number): string => {
    if (opts.formatCell) {
      return opts.formatCell(value, rowIdx, colIdx, headers[colIdx] || '')
    }
    return value
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Truncation warning */}
      {truncated && (
        <div className="px-4 py-1.5 border-b border-border bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs text-center shrink-0">
          Showing first {CSV_MAX_ROWS.toLocaleString()} of {totalLines.toLocaleString()} rows. Download the file to view
          all data.
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {rows.length.toLocaleString()} rows × {headers.length} columns
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hasHeader}
            onChange={(e) => setHasHeader(e.target.checked)}
            className="rounded border-muted-foreground/30"
          />
          <span className="text-xs text-muted-foreground">First row is header</span>
        </label>
      </div>

      {/* Virtualized Table */}
      <div ref={parentRef} className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <div style={{ width: totalWidth, minWidth: '100%' }}>
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 flex bg-muted border-b border-border" style={{ width: totalWidth }}>
            {opts.showRowNumbers && (
              <div className="sticky left-0 z-30 flex-shrink-0 w-14 px-3 py-2 text-left text-xs font-semibold text-muted-foreground border-r border-border bg-muted">
                #
              </div>
            )}
            {headers.map((header, i) => (
              <div
                key={i}
                className={cn(
                  'flex-shrink-0 px-3 py-2 text-left text-xs font-semibold border-r border-border last:border-r-0 bg-muted truncate',
                  highlightIndices.has(i) && 'bg-primary/10',
                )}
                style={{ width: columnWidths[i] }}
                title={header}
              >
                {header || <span className="text-muted-foreground italic">empty</span>}
              </div>
            ))}
          </div>

          {/* Virtual Rows */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]
              return (
                <div
                  key={virtualRow.index}
                  className={cn(
                    'absolute left-0 w-full flex border-b border-border hover:bg-muted/50',
                    opts.alternateRowColors && virtualRow.index % 2 === 1 && 'bg-muted/20',
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {/* Sticky Row Number */}
                  {opts.showRowNumbers && (
                    <div className="sticky left-0 z-10 flex-shrink-0 w-14 px-3 py-1.5 text-xs text-muted-foreground border-r border-border font-mono bg-background flex items-center">
                      {virtualRow.index + 1}
                    </div>
                  )}
                  {/* Cells */}
                  {headers.map((_, cellIdx) => {
                    const value = row[cellIdx] || ''
                    const formattedValue = formatCellValue(value, virtualRow.index, cellIdx)
                    return (
                      <div
                        key={cellIdx}
                        className={cn(
                          'flex-shrink-0 px-3 py-1.5 text-sm border-r border-border last:border-r-0 truncate flex items-center',
                          highlightIndices.has(cellIdx) && 'bg-primary/5',
                        )}
                        style={{ width: columnWidths[cellIdx] }}
                        title={value}
                      >
                        {formattedValue || (
                          <span className="text-muted-foreground/50 italic">
                            {opts.emptyValuePlaceholder || 'empty'}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// JSON Viewer Component with Virtualization
// ============================================

interface JsonViewerProps {
  content: string
  options?: TextPreviewOptions
}

function JsonViewer({ content, options }: JsonViewerProps) {
  const opts = { ...DEFAULT_TEXT_OPTIONS, ...options }
  const parentRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  const lines = useMemo(() => {
    try {
      const parsed = JSON.parse(content)
      const formatted = JSON.stringify(parsed, null, opts.tabSize)
      setError(null)
      return formatted.split('\n')
    } catch {
      setError('Invalid JSON format')
      return content.split('\n')
    }
  }, [content, opts.tabSize])

  const lineNumberWidth = useMemo(() => {
    const digits = String(lines.length).length
    return Math.max(40, digits * 10 + 16)
  }, [lines.length])

  const rowVirtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 30,
  })

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-xs text-destructive">{error}</span>
          ) : (
            <span className="text-xs text-green-600 dark:text-green-400">Valid JSON</span>
          )}
          <span className="text-xs text-muted-foreground">{lines.length.toLocaleString()} lines</span>
        </div>
      </div>

      {/* Virtualized Content */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto font-mono text-sm bg-muted/20"
        style={{ minHeight: 0, fontSize: opts.fontSize }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
            width: '100%',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const line = lines[virtualRow.index]
            return (
              <div
                key={virtualRow.index}
                className="absolute left-0 w-full flex hover:bg-muted/50"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Line Number */}
                {opts.showLineNumbers && (
                  <div
                    className="flex-shrink-0 px-2 text-right text-muted-foreground select-none border-r border-border bg-background sticky left-0 flex items-center justify-end"
                    style={{ width: lineNumberWidth }}
                  >
                    {virtualRow.index + 1}
                  </div>
                )}
                {/* Line Content */}
                <div
                  className={cn(
                    'flex-1 px-3 overflow-x-auto flex items-center',
                    opts.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
                  )}
                >
                  {line || ' '}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Text Viewer Component with Virtualization
// ============================================

interface TextViewerProps {
  content: string
  fileName: string
  options?: TextPreviewOptions
}

function TextViewer({ content, fileName, options }: TextViewerProps) {
  const opts = { ...DEFAULT_TEXT_OPTIONS, ...options }
  const parentRef = useRef<HTMLDivElement>(null)
  const lines = useMemo(() => content.split('\n'), [content])
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  const lineNumberWidth = useMemo(() => {
    const digits = String(lines.length).length
    return Math.max(40, digits * 10 + 16)
  }, [lines.length])

  const rowVirtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 30,
  })

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <span className="text-xs text-muted-foreground">{lines.length.toLocaleString()} lines</span>
        <span className="text-xs text-muted-foreground uppercase">{ext || 'txt'}</span>
      </div>

      {/* Virtualized Content */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto font-mono text-sm bg-muted/20"
        style={{ minHeight: 0, fontSize: opts.fontSize }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
            width: '100%',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const line = lines[virtualRow.index]
            return (
              <div
                key={virtualRow.index}
                className="absolute left-0 w-full flex hover:bg-muted/50"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Line Number */}
                {opts.showLineNumbers && (
                  <div
                    className="flex-shrink-0 px-2 py-0.5 text-right text-muted-foreground select-none border-r border-border bg-background sticky left-0"
                    style={{ width: lineNumberWidth }}
                  >
                    {virtualRow.index + 1}
                  </div>
                )}
                {/* Line Content */}
                <div
                  className={cn(
                    'flex-1 px-3 py-0.5 overflow-x-auto',
                    opts.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
                  )}
                >
                  {line || ' '}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Image Viewer with Enhanced Controls
// ============================================

interface ImageViewerProps {
  src: string
  name: string
  options?: ImagePreviewOptions
}

function ImageViewer({ src, name, options }: ImageViewerProps) {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options }
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 5))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!opts.allowZoom) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom((prev) => Math.max(0.25, Math.min(5, prev + delta)))
    },
    [opts.allowZoom],
  )

  const backgroundClass = useMemo(() => {
    switch (opts.transparentBackground) {
      case 'checkerboard':
        return 'bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]'
      case 'white':
        return 'bg-white'
      case 'black':
        return 'bg-black'
      default:
        return 'bg-background'
    }
  }, [opts.transparentBackground])

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      {opts.allowZoom && (
        <div className="flex items-center justify-center gap-2 py-2 bg-background/50 border-b border-border">
          <Button variant="ghost" size="icon-sm" onClick={handleZoomOut} title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[4rem] text-center font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon-sm" onClick={handleZoomIn} title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-2" />
          <Button variant="ghost" size="icon-sm" onClick={handleRotate} title="Rotate 90°">
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleReset} title="Reset view">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Image Container */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 overflow-hidden flex items-center justify-center',
          backgroundClass,
          zoom > 1 ? 'cursor-grab' : 'cursor-default',
          isDragging && 'cursor-grabbing',
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          src={src}
          alt={name}
          onLoad={handleImageLoad}
          className="max-w-full max-h-full object-contain select-none transition-transform duration-100"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            maxWidth: opts.maxWidth || undefined,
            maxHeight: opts.maxHeight || undefined,
          }}
          draggable={false}
        />
      </div>

      {/* Metadata */}
      {opts.showMetadata && dimensions && (
        <div className="flex items-center justify-center gap-4 py-2 text-xs text-muted-foreground bg-background/50 border-t border-border">
          <span>
            {dimensions.width} × {dimensions.height} px
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================
// PDF Viewer Component with Page Navigation
// ============================================

interface PdfViewerProps {
  src: string
}

function PdfViewer({ src }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [containerWidth, setContainerWidth] = useState<number>(800)

  // Track container width for responsive scaling
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 48)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (err: Error) => {
    setError(err.message || 'Failed to load PDF')
    setIsLoading(false)
  }

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5))
  const handleFitWidth = () => setScale(1)

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, numPages))
      setCurrentPage(validPage)

      const pageElement = pageRefs.current.get(validPage)
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [numPages],
  )

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      goToPage(value)
    }
  }

  const setPageRef = useCallback((pageNum: number, element: HTMLDivElement | null) => {
    if (element) {
      pageRefs.current.set(pageNum, element)
    } else {
      pageRefs.current.delete(pageNum)
    }
  }, [])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* PDF Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <Button variant="ghost" size="icon-sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={handlePageInputChange}
              className="w-14 h-7 text-center text-sm border border-border rounded bg-background px-2"
            />
            <span className="text-sm text-muted-foreground">/ {numPages}</span>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-xs text-muted-foreground min-w-[50px] text-center">{Math.round(scale * 100)}%</span>

          <Button variant="ghost" size="icon-sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button variant="ghost" size="sm" onClick={handleFitWidth} className="text-xs">
            Fit
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/20" style={{ minHeight: 0 }}>
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Failed to load PDF</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-6">
            <Document
              file={src}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Loading PDF...</p>
                  </div>
                </div>
              }
              className="flex flex-col items-center gap-4"
            >
              {!isLoading &&
                Array.from({ length: numPages }, (_, index) => {
                  const pageNum = index + 1
                  return (
                    <div
                      key={pageNum}
                      ref={(el) => setPageRef(pageNum, el)}
                      className={cn(
                        'shadow-lg rounded-sm overflow-hidden bg-white scroll-mt-6',
                        currentPage === pageNum && 'ring-2 ring-primary',
                      )}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      <Page
                        pageNumber={pageNum}
                        width={containerWidth * scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </div>
                  )
                })}
            </Document>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Video Preview Component
// ============================================

function VideoPreview({ src, name }: { src: string; name: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-black">
      <video src={src} controls autoPlay={false} className="max-w-full max-h-full rounded">
        Your browser does not support video playback for {name}.
      </video>
    </div>
  )
}

// ============================================
// No Preview Component
// ============================================

function NoPreview({ mimeType, name }: { mimeType: string; name: string }) {
  const iconType = getFileIconType(mimeType)
  const Icon = iconMap[iconType]

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center">
        <Icon className="w-12 h-12 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-medium mb-1">{name}</h3>
        <p className="text-muted-foreground text-sm">Preview not available for this file type</p>
        <p className="text-muted-foreground text-xs mt-1">{mimeType || 'Unknown type'}</p>
      </div>
    </div>
  )
}

// ============================================
// Loading with Progress Component
// ============================================

interface LoadingProgressProps {
  fileName: string
  mimeType: string
  progress: DownloadProgress | null
}

function LoadingProgress({ fileName, mimeType, progress }: LoadingProgressProps) {
  const iconType = getFileIconType(mimeType)
  const Icon = iconMap[iconType]

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4 w-80">
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>

        <p className="font-medium truncate">{fileName}</p>

        {progress && (
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-150 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {formatFileSize(progress.loaded)}
                {progress.total && ` / ${formatFileSize(progress.total)}`}
              </span>
              <span>{progress.percentage}%</span>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {progress?.percentage === 100 ? 'Processing file...' : 'Downloading file...'}
        </p>
      </div>
    </div>
  )
}

// ============================================
// Main Dialog Component
// ============================================

export function FilePreviewDialog({
  isOpen,
  onClose,
  src,
  name,
  size,
  mimeType,
  onFetchFile,
  previewOptions,
}: FilePreviewDialogProps) {
  const [textContent, setTextContent] = useState<string | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)

  const fileCategory = useMemo(() => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType === 'application/pdf') return 'pdf'
    if (isCsv(mimeType, name)) return 'csv'
    if (isJson(mimeType, name)) return 'json'
    if (isTextBased(mimeType)) return 'text'
    return 'unknown'
  }, [mimeType, name])

  const needsTextFetch = ['csv', 'json', 'text'].includes(fileCategory)

  // Fetch text content for text-based files with progress tracking
  useEffect(() => {
    if (!isOpen || !needsTextFetch) {
      setTextContent(null)
      setDownloadProgress(null)
      return
    }

    const abortController = new AbortController()

    const fetchContent = async () => {
      setIsLoadingContent(true)
      setLoadError(null)
      setDownloadProgress({ loaded: 0, total: size || null, percentage: 0 })

      try {
        let text: string

        if (onFetchFile) {
          const result = await onFetchFile(src, mimeType)
          text = typeof result === 'string' ? result : await result.text()
        } else if (src.startsWith('data:')) {
          const base64Content = src.split(',')[1]
          if (!base64Content) throw new Error('Invalid data URL')
          text = atob(base64Content)
        } else {
          const response = await fetch(src, { signal: abortController.signal })
          if (!response.ok) throw new Error('Failed to fetch file')

          const contentLength = response.headers.get('content-length')
          const total = contentLength ? parseInt(contentLength, 10) : size || null

          if (!response.body) {
            text = await response.text()
          } else {
            const reader = response.body.getReader()
            const chunks: Uint8Array[] = []
            let loaded = 0

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              chunks.push(value)
              loaded += value.length

              const percentage = total ? Math.round((loaded / total) * 100) : 0
              setDownloadProgress({ loaded, total, percentage })
            }

            const allChunks = new Uint8Array(loaded)
            let position = 0
            for (const chunk of chunks) {
              allChunks.set(chunk, position)
              position += chunk.length
            }

            const decoder = new TextDecoder('utf-8')
            text = decoder.decode(allChunks)
          }
        }

        setTextContent(text)
        setDownloadProgress(null)
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        setLoadError('Failed to load file content')
        console.error('Error fetching file content:', error)
        setDownloadProgress(null)
      } finally {
        setIsLoadingContent(false)
      }
    }

    fetchContent()

    return () => {
      abortController.abort()
    }
  }, [isOpen, src, mimeType, size, needsTextFetch, onFetchFile])

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = src
    link.download = name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [src, name])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const preview = canPreview(mimeType)

  const renderPreview = () => {
    if (isLoadingContent) {
      return <LoadingProgress fileName={name} mimeType={mimeType} progress={downloadProgress} />
    }

    if (loadError) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">{loadError}</p>
              <p className="text-sm text-muted-foreground mt-1">Try downloading the file instead</p>
            </div>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </div>
        </div>
      )
    }

    if (!preview) {
      return <NoPreview mimeType={mimeType} name={name} />
    }

    switch (fileCategory) {
      case 'image':
        return <ImageViewer src={src} name={name} options={previewOptions?.image} />
      case 'video':
        return <VideoPreview src={src} name={name} />
      case 'pdf':
        return <PdfViewer src={src} />
      case 'csv':
        return textContent ? <CsvViewer content={textContent} options={previewOptions?.csv} /> : null
      case 'json':
        return textContent ? <JsonViewer content={textContent} options={previewOptions?.text} /> : null
      case 'text':
        return textContent ? <TextViewer content={textContent} fileName={name} options={previewOptions?.text} /> : null
      default:
        return <NoPreview mimeType={mimeType} name={name} />
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="absolute inset-0 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <h2 className="font-medium truncate" title={name}>
                {name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(size)} · {mimeType || 'Unknown type'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            'flex-1 overflow-hidden bg-background flex flex-col',
            fileCategory === 'image' && 'bg-muted/50',
          )}
        >
          {renderPreview()}
        </div>
      </div>
    </div>,
    document.body,
  )
}
