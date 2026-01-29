import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FileAttachmentComponent } from '../file-attachment'

export type FileFetcher = (src: string, mimeType: string) => Promise<string | Blob>

// Import preview options types
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

export type FileDeleteHandler = (src: string, name: string, mimeType: string) => void

export interface FileAttachmentOptions {
  HTMLAttributes: Record<string, unknown>
  /**
   * Custom file fetcher for preview. Use this when files are stored behind
   * authentication or need special handling to retrieve content.
   */
  onFetchFile?: FileFetcher
  /**
   * Preview customization options
   */
  previewOptions?: PreviewOptions
  /**
   * Callback when a file is deleted from the editor.
   */
  onFileDelete?: FileDeleteHandler
}

export type FileDisplayMode = 'block' | 'inline'
export type FileAlignment = 'left' | 'center' | 'right'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileAttachment: {
      /**
       * Add a file attachment (inline - allows text before/after)
       */
      setFileAttachment: (attributes: {
        src: string
        name: string
        size: number
        mimeType: string
        displayMode?: FileDisplayMode
        alignment?: FileAlignment
        width?: number
      }) => ReturnType
      /**
       * Add a file attachment as a block (on its own line)
       */
      setFileAttachmentBlock: (attributes: {
        src: string
        name: string
        size: number
        mimeType: string
        alignment?: FileAlignment
        width?: number
      }) => ReturnType
      /**
       * Update file attachment attributes
       */
      updateFileAttachment: (attributes: Partial<{
        displayMode: FileDisplayMode
        alignment: FileAlignment
        width: number
      }>) => ReturnType
      /**
       * Remove current file attachment
       */
      removeFileAttachment: () => ReturnType
    }
  }
}

export const FileAttachment = Node.create<FileAttachmentOptions>({
  name: 'fileAttachment',

  // Use inline group to allow text before/after
  group: 'inline',

  // This is an inline node
  inline: true,

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      onFetchFile: undefined,
      previewOptions: undefined,
      onFileDelete: undefined,
    }
  },

  addStorage() {
    return {
      onFetchFile: this.options.onFetchFile,
      previewOptions: this.options.previewOptions,
      onFileDelete: this.options.onFileDelete,
    }
  },

  addAttributes() {
    return {
      src: {
        default: '',
      },
      name: {
        default: '',
      },
      size: {
        default: 0,
      },
      mimeType: {
        default: '',
      },
      displayMode: {
        default: 'inline',
      },
      alignment: {
        default: 'left',
      },
      width: {
        default: null, // null means auto/original size
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-file-attachment]',
      },
      // Also parse div for backwards compatibility
      {
        tag: 'div[data-file-attachment]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-file-attachment': '',
        'data-display-mode': HTMLAttributes.displayMode || 'inline',
        'data-alignment': HTMLAttributes.alignment || 'left',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentComponent)
  },

  addCommands() {
    return {
      setFileAttachment:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...attributes,
              displayMode: attributes.displayMode ?? 'inline',
              alignment: attributes.alignment ?? 'left',
            },
          })
        },
      setFileAttachmentBlock:
        (attributes) =>
        ({ chain }) => {
          // Insert a new paragraph, then the file attachment as a block, then another paragraph
          return chain()
            .insertContent([
              {
                type: 'paragraph',
                content: [
                  {
                    type: this.name,
                    attrs: {
                      ...attributes,
                      displayMode: 'block',
                      alignment: attributes.alignment ?? 'left',
                    },
                  },
                ],
              },
            ])
            .run()
        },
      updateFileAttachment:
        (attributes) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attributes)
        },
      removeFileAttachment:
        () =>
        ({ commands }) => {
          return commands.deleteSelection()
        },
    }
  },
})
