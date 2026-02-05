import type { Editor } from '@tiptap/react'
import type { LucideIcon } from 'lucide-react'

// Content format types
export type EditorContentFormat = 'html' | 'json' | 'text'

export interface EditorContent {
  html?: string
  json?: Record<string, unknown>
  text?: string
}

// Editor action context for commands that need special UI (like dialogs/popovers)
export interface EditorActionContext {
  openLinkPopover: () => void
}

// Slash command types
export interface SlashCommand {
  name: string
  description: string
  icon: LucideIcon
  aliases?: string[]
  group: SlashCommandGroup
  action: (editor: Editor, context?: EditorActionContext) => void
}

export type SlashCommandGroup =
  | 'basic'
  | 'lists'
  | 'formatting'
  | 'media'
  | 'advanced'
  | 'custom'

export interface SlashCommandGroupInfo {
  id: SlashCommandGroup
  label: string
  priority: number
}

// Toolbar action types
export interface ToolbarAction {
  id: string
  icon: LucideIcon
  label: string
  isActive?: (editor: Editor) => boolean
  action: (editor: Editor) => void
}

// Plugin types
export interface EditorPlugin {
  name: string
  slashCommands?: SlashCommand[]
  toolbarActions?: ToolbarAction[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extensions?: any[]
  onInit?: (editor: Editor) => void
  onDestroy?: () => void
}

// Main editor props
export interface RichTextEditorProps {
  /** Initial content (HTML string or JSON) */
  content?: string | Record<string, unknown>
  /** Callback when content changes */
  onChange?: (content: EditorContent) => void
  /** Whether the editor is editable */
  editable?: boolean
  /** Placeholder text when editor is empty */
  placeholder?: string
  /** Enable autofocus on mount */
  autoFocus?: boolean
  /** Additional class names */
  className?: string
  /** Show the fixed toolbar at the top (defaults to true in edit mode) */
  showToolbar?: boolean
  /** Enable mentions (requires onMention callback) */
  enableMentions?: boolean
  /** Callback to search users for mentions */
  onMention?: (query: string) => Promise<MentionItem[]>
  /** Enable file uploads (requires onFileUpload callback) */
  enableFileUpload?: boolean
  /** Callback to handle file uploads */
  onFileUpload?: (file: File) => Promise<string>
  /** Custom plugins */
  plugins?: EditorPlugin[]
  /** Minimum height of the editor */
  minHeight?: string | number
  /** Maximum height for code blocks. If not set, code blocks expand fully. */
  codeBlockMaxHeight?: string | number
  /** Custom callout types. If not provided, defaults to info, warning, error, success. */
  calloutTypes?: CalloutTypeConfig[]
}

// Viewer props (lighter weight)
export interface RichTextViewerProps {
  /** Content to display (HTML string or JSON) */
  content: string | Record<string, unknown>
  /** Additional class names */
  className?: string
  /** Callback when a mention is clicked */
  onMentionClick?: (item: MentionItem, event: MouseEvent) => void
  /** Maximum height for code blocks. If not set, code blocks expand fully. */
  codeBlockMaxHeight?: string | number
}

// Mention types
export interface MentionItem {
  id: string
  label: string
  avatar?: string
  metadata?: Record<string, unknown>
}

// Editor ref for imperative handle
export interface RichTextEditorRef {
  getEditor: () => Editor | null
  getContent: (format?: EditorContentFormat) => string | Record<string, unknown> | null
  setContent: (content: string | Record<string, unknown>) => void
  focus: () => void
  blur: () => void
  isEmpty: () => boolean
  clear: () => void
}

// Command menu state
export interface CommandMenuState {
  isOpen: boolean
  query: string
  selectedIndex: number
  items: SlashCommand[]
  position: { top: number; left: number } | null
}

// File attachment types
export type FileDisplayMode = 'block' | 'inline'
export type FileAlignment = 'left' | 'center' | 'right'

export interface FileAttachmentAttributes {
  src: string
  name: string
  size: number
  mimeType: string
  displayMode: FileDisplayMode
  alignment: FileAlignment
  width: number | null
  uploading?: boolean
  uploadId?: string | null
}

// Callout types
export interface CalloutTypeConfig {
  /** Unique identifier for this callout type */
  id: string
  /** Display label shown in dropdown */
  label: string
  /** Lucide icon component */
  icon: LucideIcon
  /** Light mode background color (CSS color value) */
  bgLight?: string
  /** Light mode border color (CSS color value) */
  borderLight?: string
  /** Light mode icon color (CSS color value) */
  iconColorLight?: string
  /** Dark mode background color (CSS color value) */
  bgDark?: string
  /** Dark mode border color (CSS color value) */
  borderDark?: string
  /** Dark mode icon color (CSS color value) */
  iconColorDark?: string
}
