import { useState, useEffect, useCallback, useMemo } from 'react'
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
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ============================================
// Preview Options Types
// ============================================

export type FileFetcher = (src: string, mimeType: string) => Promise<string | Blob>

export interface CsvPreviewOptions {
  maxRows?: number
  maxColumns?: number
  showRowNumbers?: boolean
  headerRow?: boolean
  delimiter?: ',' | ';' | '\t' | '|' | 'auto'
  stripWhitespace?: boolean
  emptyValuePlaceholder?: string
  maxCellWidth?: number
  wrapText?: boolean
  freezeHeader?: boolean
  alternateRowColors?: boolean
  formatCell?: (value: string, rowIndex: number, colIndex: number, header: string) => string
  highlightColumns?: (number | string)[]
}

export interface TextPreviewOptions {
  maxChars?: number
  maxLines?: number
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
  maxRows: 1000,
  maxColumns: 50,
  showRowNumbers: false,
  headerRow: true,
  delimiter: 'auto',
  stripWhitespace: true,
  emptyValuePlaceholder: '-',
  maxCellWidth: 300,
  wrapText: false,
  freezeHeader: true,
  alternateRowColors: true,
}

const DEFAULT_TEXT_OPTIONS: Required<TextPreviewOptions> = {
  maxChars: 500000,
  maxLines: 10000,
  showLineNumbers: false,
  wordWrap: true,
  fontSize: 13,
  tabSize: 2,
}

const DEFAULT_IMAGE_OPTIONS: Required<ImagePreviewOptions> = {
  maxWidth: 0, // 0 = no limit
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

function getFileIconType(mimeType: string): 'image' | 'text' | 'spreadsheet' | 'archive' | 'code' | 'generic' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('text/') || mimeType.includes('document')) return 'text'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet'
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return 'archive'
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return 'code'
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

function canPreview(mimeType: string): boolean {
  if (mimeType.startsWith('image/')) return true
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

/**
 * Auto-detect CSV delimiter from content
 */
function detectDelimiter(content: string): ',' | ';' | '\t' | '|' {
  const firstLines = content.split('\n').slice(0, 5).join('\n')
  const counts = {
    ',': (firstLines.match(/,/g) || []).length,
    ';': (firstLines.match(/;/g) || []).length,
    '\t': (firstLines.match(/\t/g) || []).length,
    '|': (firstLines.match(/\|/g) || []).length,
  }

  // Return the delimiter with the highest count
  const max = Math.max(...Object.values(counts))
  if (max === 0) return ','

  for (const [delim, count] of Object.entries(counts)) {
    if (count === max) return delim as ',' | ';' | '\t' | '|'
  }
  return ','
}

// ============================================
// Image Preview Component
// ============================================

interface ImagePreviewProps {
  src: string
  name: string
  options?: ImagePreviewOptions
}

function ImagePreview({ src, name, options }: ImagePreviewProps) {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options }
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
  }

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 4))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25))
  const handleRotate = () => setRotation(r => (r + 90) % 360)
  const handleReset = () => { setZoom(1); setRotation(0) }

  const backgroundClass = useMemo(() => {
    switch (opts.transparentBackground) {
      case 'checkerboard':
        return 'bg-[length:20px_20px] bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]'
      case 'white':
        return 'bg-white'
      case 'black':
        return 'bg-black'
      default:
        return ''
    }
  }, [opts.transparentBackground])

  const imageStyle: React.CSSProperties = {
    transform: `scale(${zoom}) rotate(${rotation}deg)`,
    transition: 'transform 0.2s ease',
    maxWidth: opts.maxWidth || '100%',
    maxHeight: opts.maxHeight || '100%',
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      {opts.allowZoom && (
        <div className="flex items-center justify-center gap-2 py-2 bg-background/50 border-b border-border">
          <Button variant="ghost" size="icon-sm" onClick={handleZoomOut} title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon-sm" onClick={handleZoomIn} title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-2" />
          <Button variant="ghost" size="icon-sm" onClick={handleRotate} title="Rotate">
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
            Reset
          </Button>
        </div>
      )}

      {/* Image */}
      <div className={cn(
        "flex-1 flex items-center justify-center p-4 overflow-auto",
        backgroundClass
      )}>
        <img
          src={src}
          alt={name}
          onLoad={handleImageLoad}
          className="object-contain rounded-lg shadow-lg"
          style={imageStyle}
        />
      </div>

      {/* Metadata */}
      {opts.showMetadata && dimensions && (
        <div className="flex items-center justify-center gap-4 py-2 text-xs text-muted-foreground bg-background/50 border-t border-border">
          <span>{dimensions.width} × {dimensions.height} px</span>
        </div>
      )}
    </div>
  )
}

// ============================================
// Text Preview Component
// ============================================

interface TextPreviewProps {
  src: string
  mimeType: string
  onFetchFile?: FileFetcher
  options?: TextPreviewOptions
}

function TextPreview({ src, mimeType, onFetchFile, options }: TextPreviewProps) {
  const opts = { ...DEFAULT_TEXT_OPTIONS, ...options }
  const [content, setContent] = useState<string | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  const [originalSize, setOriginalSize] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsTruncated(false)

        let text: string

        if (onFetchFile) {
          const result = await onFetchFile(src, mimeType)
          text = typeof result === 'string' ? result : await result.text()
        } else if (src.startsWith('data:')) {
          const base64Content = src.split(',')[1]
          if (!base64Content) throw new Error('Invalid data URL')
          text = atob(base64Content)
        } else {
          const response = await fetch(src)
          if (!response.ok) throw new Error('Failed to fetch file')
          text = await response.text()
        }

        setOriginalSize(text.length)

        // Apply limits
        if (text.length > opts.maxChars) {
          text = text.slice(0, opts.maxChars)
          setIsTruncated(true)
        }

        const lines = text.split('\n')
        if (lines.length > opts.maxLines) {
          text = lines.slice(0, opts.maxLines).join('\n')
          setIsTruncated(true)
        }

        setContent(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content')
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [src, mimeType, onFetchFile, opts.maxChars, opts.maxLines])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <AlertCircle className="w-8 h-8" />
        <p>{error}</p>
      </div>
    )
  }

  const isJson = mimeType === 'application/json' || mimeType.includes('json')
  let displayContent = content

  if (isJson && content) {
    try {
      displayContent = JSON.stringify(JSON.parse(content), null, opts.tabSize)
    } catch {
      // Keep original
    }
  }

  const lines = displayContent?.split('\n') || []

  return (
    <div className="h-full flex flex-col p-4">
      {isTruncated && (
        <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-md text-sm text-amber-600 dark:text-amber-400">
          <strong>Large file:</strong> Showing first {(content?.length || 0).toLocaleString()} of {originalSize.toLocaleString()} characters.
          Download the file to view all content.
        </div>
      )}

      <div className="flex-1 overflow-auto bg-muted rounded-lg">
        {opts.showLineNumbers ? (
          <table className="w-full text-sm font-mono" style={{ fontSize: opts.fontSize }}>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-background/50">
                  <td className="px-3 py-0.5 text-muted-foreground select-none text-right border-r border-border w-12">
                    {i + 1}
                  </td>
                  <td className={cn(
                    "px-3 py-0.5",
                    opts.wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                  )}>
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre
            className={cn(
              "p-4",
              opts.wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"
            )}
            style={{ fontSize: opts.fontSize, tabSize: opts.tabSize }}
          >
            {displayContent}
            {isTruncated && (
              <span className="text-muted-foreground italic">
                {'\n\n'}... content truncated ...
              </span>
            )}
          </pre>
        )}
      </div>
    </div>
  )
}

// ============================================
// CSV Preview Component
// ============================================

interface CsvPreviewProps {
  src: string
  onFetchFile?: FileFetcher
  options?: CsvPreviewOptions
}

function CsvPreview({ src, onFetchFile, options }: CsvPreviewProps) {
  const opts = { ...DEFAULT_CSV_OPTIONS, ...options }
  const [data, setData] = useState<string[][] | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [totalColumns, setTotalColumns] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Determine which columns to highlight (convert names to indices)
  const highlightIndices = useMemo(() => {
    if (!opts.highlightColumns || !headers.length) return new Set<number>()

    return new Set(
      opts.highlightColumns.map(col => {
        if (typeof col === 'number') return col
        return headers.indexOf(col)
      }).filter(i => i >= 0)
    )
  }, [opts.highlightColumns, headers])

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        setError(null)

        let csvText: string

        if (onFetchFile) {
          const result = await onFetchFile(src, 'text/csv')
          csvText = typeof result === 'string' ? result : await result.text()
        } else if (src.startsWith('data:')) {
          const base64Content = src.split(',')[1]
          if (!base64Content) throw new Error('Invalid data URL')
          csvText = atob(base64Content)
        } else {
          const response = await fetch(src)
          if (!response.ok) throw new Error('Failed to fetch file')
          csvText = await response.text()
        }

        // Detect or use specified delimiter
        const delimiter = opts.delimiter === 'auto'
          ? detectDelimiter(csvText)
          : opts.delimiter

        // Parse CSV
        const allRows = csvText.split('\n').filter(row => row.trim())
        const totalRowCount = allRows.length

        // Limit rows
        const rowsToParse = allRows.slice(0, opts.maxRows + (opts.headerRow ? 1 : 0))

        const parsed = rowsToParse.map(row => {
          const fields: string[] = []
          let current = ''
          let inQuotes = false

          for (let i = 0; i < row.length; i++) {
            const char = row[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === delimiter && !inQuotes) {
              fields.push(opts.stripWhitespace ? current.trim() : current)
              current = ''
            } else {
              current += char
            }
          }
          fields.push(opts.stripWhitespace ? current.trim() : current)
          return fields
        })

        const originalColumnCount = parsed[0]?.length || 0

        // Limit columns
        const truncatedParsed = parsed.map(row => row.slice(0, opts.maxColumns))

        // Split headers and data
        if (opts.headerRow && truncatedParsed.length > 0) {
          setHeaders(truncatedParsed[0])
          setData(truncatedParsed.slice(1))
        } else {
          // Generate column headers (A, B, C, ...)
          const colCount = truncatedParsed[0]?.length || 0
          const generatedHeaders = Array.from({ length: colCount }, (_, i) =>
            String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : '')
          )
          setHeaders(generatedHeaders)
          setData(truncatedParsed)
        }

        setTotalRows(totalRowCount)
        setTotalColumns(originalColumnCount)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CSV')
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [src, onFetchFile, opts.maxRows, opts.maxColumns, opts.delimiter, opts.stripWhitespace, opts.headerRow])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <AlertCircle className="w-8 h-8" />
        <p>{error || 'No data'}</p>
      </div>
    )
  }

  const displayedRows = data.length
  const displayedColumns = headers.length
  const isRowsTruncated = totalRows > opts.maxRows + (opts.headerRow ? 1 : 0)
  const isColumnsTruncated = totalColumns > opts.maxColumns

  const formatCellValue = (value: string, rowIdx: number, colIdx: number): string => {
    if (opts.formatCell) {
      return opts.formatCell(value, rowIdx, colIdx, headers[colIdx] || '')
    }
    return value
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Truncation warning */}
      {(isRowsTruncated || isColumnsTruncated) && (
        <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-md text-sm text-amber-600 dark:text-amber-400">
          <strong>Large file:</strong> Showing {displayedRows.toLocaleString()} of {(totalRows - (opts.headerRow ? 1 : 0)).toLocaleString()} rows
          {isColumnsTruncated && `, ${displayedColumns} of ${totalColumns} columns`}.
          Download the file to view all data.
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto border border-border rounded-lg">
        <div className="min-w-max">
          <table className="w-full text-sm border-collapse">
            <thead className={cn("bg-muted", opts.freezeHeader && "sticky top-0 z-10")}>
              <tr>
                {opts.showRowNumbers && (
                  <th className="px-3 py-2 text-center font-medium border-b border-r border-border bg-muted w-12 text-muted-foreground">
                    #
                  </th>
                )}
                {headers.map((header, i) => (
                  <th
                    key={i}
                    className={cn(
                      "px-4 py-2 text-left font-medium border-b border-border",
                      highlightIndices.has(i) && "bg-primary/10",
                      !opts.wrapText && "whitespace-nowrap"
                    )}
                    style={{ maxWidth: opts.maxCellWidth }}
                  >
                    {header || <span className="text-muted-foreground italic">empty</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={cn(
                    "hover:bg-muted/50",
                    opts.alternateRowColors && rowIdx % 2 === 1 && "bg-muted/20"
                  )}
                >
                  {opts.showRowNumbers && (
                    <td className="px-3 py-2 text-center border-b border-r border-border text-muted-foreground text-xs">
                      {rowIdx + 1}
                    </td>
                  )}
                  {row.map((cell, cellIdx) => {
                    const formattedValue = formatCellValue(cell, rowIdx, cellIdx)
                    return (
                      <td
                        key={cellIdx}
                        className={cn(
                          "px-4 py-2 border-b border-border",
                          highlightIndices.has(cellIdx) && "bg-primary/5",
                          !opts.wrapText && "whitespace-nowrap truncate"
                        )}
                        style={{ maxWidth: opts.maxCellWidth }}
                        title={!opts.wrapText && cell.length > 30 ? cell : undefined}
                      >
                        {formattedValue || <span className="text-muted-foreground">{opts.emptyValuePlaceholder}</span>}
                      </td>
                    )
                  })}
                  {/* Fill missing cells */}
                  {row.length < headers.length &&
                    Array.from({ length: headers.length - row.length }).map((_, i) => (
                      <td
                        key={`empty-${i}`}
                        className={cn(
                          "px-4 py-2 border-b border-border",
                          highlightIndices.has(row.length + i) && "bg-primary/5"
                        )}
                      >
                        <span className="text-muted-foreground">{opts.emptyValuePlaceholder}</span>
                      </td>
                    ))
                  }
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <p className="text-xs text-muted-foreground mt-2">
        {isRowsTruncated ? (
          <>Showing {displayedRows.toLocaleString()} of {(totalRows - (opts.headerRow ? 1 : 0)).toLocaleString()} rows</>
        ) : (
          <>{displayedRows.toLocaleString()} rows</>
        )}
        {', '}
        {isColumnsTruncated ? (
          <>{displayedColumns} of {totalColumns} columns</>
        ) : (
          <>{displayedColumns} columns</>
        )}
      </p>
    </div>
  )
}

// ============================================
// PDF Preview Component
// ============================================

function PdfPreview({ src, name }: { src: string; name: string }) {
  return (
    <div className="h-full p-4">
      <iframe
        src={src}
        title={name}
        className="w-full h-full rounded-lg border border-border"
      />
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
        <p className="text-muted-foreground text-sm">
          Preview not available for this file type
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          {mimeType || 'Unknown type'}
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
  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = src
    link.download = name
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
  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'
  const isCsvFile = isCsv(mimeType, name)
  const isText = isTextBased(mimeType) && !isCsvFile

  const renderPreview = () => {
    if (!preview) {
      return <NoPreview mimeType={mimeType} name={name} />
    }
    if (isImage) {
      return <ImagePreview src={src} name={name} options={previewOptions?.image} />
    }
    if (isPdf) {
      return <PdfPreview src={src} name={name} />
    }
    if (isCsvFile) {
      return <CsvPreview src={src} onFetchFile={onFetchFile} options={previewOptions?.csv} />
    }
    if (isText) {
      return <TextPreview src={src} mimeType={mimeType} onFetchFile={onFetchFile} options={previewOptions?.text} />
    }
    return <NoPreview mimeType={mimeType} name={name} />
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
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
        <div className={cn(
          "flex-1 overflow-hidden",
          isImage && "bg-black/50"
        )}>
          {renderPreview()}
        </div>
      </div>
    </div>,
    document.body
  )
}
