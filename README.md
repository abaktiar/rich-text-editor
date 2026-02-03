# Rich Text Editor

A modern, feature-rich text editor component for React. Built with **Tiptap 3.x**, **React 19**, **TypeScript**, and **Tailwind CSS 4** (via shadcn/ui design tokens).

![Rich Text Editor](https://img.shields.io/badge/React-19-blue) ![Tiptap](https://img.shields.io/badge/Tiptap-3.x-purple) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4.x-cyan)

## Features

- **Slash Commands** - Type `/` to access formatting options
- **Code Blocks** - Syntax highlighting with language selector (powered by lowlight)
- **Tables** - Full table support with floating controls
- **@Mentions** - User mentions with customizable search
- **Callouts** - Info, warning, error, success blocks with custom types
- **Toggles** - Collapsible/expandable content blocks
- **File Attachments** - Upload files with preview support (images, PDFs, CSVs, text)
- **Bubble Menu** - Floating toolbar on text selection
- **Fixed Toolbar** - Comprehensive formatting toolbar
- **Plugin System** - Extend functionality with custom plugins
- **Read-only Viewer** - Lightweight component for displaying content

## Installation

Install via the [shadcn registry](https://ui.shadcn.com/docs/registry):

```bash
npx shadcn@latest add https://abaktiar.github.io/shadcn-rich-text-editor/r/rich-text-editor.json
```

This will install the component and all required dependencies.

## Quick Start

### Basic Editor

```tsx
import { RichTextEditor } from '@/components/ui/editor'

function MyEditor() {
  return (
    <RichTextEditor
      placeholder="Start writing..."
      onChange={(content) => {
        console.log(content.html)  // HTML string
        console.log(content.json)  // Tiptap JSON
        console.log(content.text)  // Plain text
      }}
    />
  )
}
```

### Read-only Viewer

```tsx
import { RichTextViewer } from '@/components/ui/editor'

function MyViewer() {
  return <RichTextViewer content={savedHtmlContent} />
}
```

### With Ref for Programmatic Control

```tsx
import { useRef } from 'react'
import { RichTextEditor, type RichTextEditorRef } from '@/components/ui/editor'

function MyEditor() {
  const editorRef = useRef<RichTextEditorRef>(null)

  const handleSave = () => {
    const html = editorRef.current?.getContent('html')
    const json = editorRef.current?.getContent('json')
    // Save content...
  }

  return (
    <>
      <RichTextEditor ref={editorRef} />
      <button onClick={handleSave}>Save</button>
      <button onClick={() => editorRef.current?.clear()}>Clear</button>
    </>
  )
}
```

## Props

### RichTextEditorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string \| object` | - | Initial content (HTML string or Tiptap JSON) |
| `onChange` | `(content: EditorContent) => void` | - | Callback when content changes |
| `editable` | `boolean` | `true` | Whether the editor is editable |
| `placeholder` | `string` | - | Placeholder text when empty |
| `autoFocus` | `boolean` | `false` | Focus editor on mount |
| `className` | `string` | - | Additional CSS classes |
| `showToolbar` | `boolean` | `true` (edit mode) | Show the fixed toolbar |
| `plugins` | `EditorPlugin[]` | `[]` | Custom plugins |
| `minHeight` | `string \| number` | `'200px'` | Minimum editor height |
| `codeBlockMaxHeight` | `string \| number` | - | Max height for code blocks (scrollable) |
| `calloutTypes` | `CalloutTypeConfig[]` | Default types | Custom callout configurations |

### RichTextViewerProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string \| object` | **required** | Content to display |
| `className` | `string` | - | Additional CSS classes |
| `onMentionClick` | `(item, event) => void` | - | Callback when mention is clicked |
| `codeBlockMaxHeight` | `string \| number` | - | Max height for code blocks |

### RichTextEditorRef (Imperative API)

```typescript
interface RichTextEditorRef {
  getEditor: () => Editor | null           // Access Tiptap editor instance
  getContent: (format?) => string | object // Get content as html/json/text
  setContent: (content) => void            // Set editor content
  focus: () => void                        // Focus the editor
  blur: () => void                         // Blur the editor
  isEmpty: () => boolean                   // Check if editor is empty
  clear: () => void                        // Clear all content
}
```

## Slash Commands

Type `/` at the start of a line to open the command menu. Built-in commands:

### Basic Blocks
- **Text** (`/text`, `/paragraph`, `/p`) - Plain paragraph
- **Heading 1** (`/h1`, `/title`) - Large heading
- **Heading 2** (`/h2`, `/subtitle`) - Medium heading
- **Heading 3** (`/h3`) - Small heading

### Lists
- **Bullet List** (`/ul`, `/bullets`) - Unordered list
- **Numbered List** (`/ol`, `/numbers`) - Ordered list
- **Task List** (`/todo`, `/checkbox`) - Checklist with checkboxes

### Formatting
- **Inline Code** (`/code`, `/mono`) - Monospace text
- **Highlight** (`/highlight`, `/mark`) - Highlighted text
- **Link** (`/link`, `/url`) - Add hyperlink

### Advanced
- **Quote** (`/quote`, `/blockquote`) - Block quote
- **Code Block** (`/codeblock`, `/pre`) - Code with syntax highlighting
- **Divider** (`/hr`, `/separator`) - Horizontal rule
- **Table** (`/table`, `/grid`) - Insert 3x3 table
- **Callout** (`/callout`, `/info`, `/alert`) - Information callout
- **Toggle** (`/toggle`, `/expand`, `/collapse`) - Collapsible section

## Plugins

### File Upload Plugin

Enable file uploads with drag-and-drop support:

```tsx
import { RichTextEditor, createFileUploadPlugin } from '@/components/ui/editor'

const fileUploadPlugin = createFileUploadPlugin({
  onUpload: async (file) => {
    // Upload to your server, return URL
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/upload', { method: 'POST', body: formData })
    const { url } = await response.json()
    return url
  },
  accept: ['image/*', 'application/pdf', '.doc', '.docx'],
  maxSize: 10 * 1024 * 1024, // 10MB
  defaultDisplayMode: 'inline', // or 'block'
  displayModeByType: {
    'image/*': 'block',
    'application/pdf': 'block',
  },
  onUploadStart: (file) => console.log('Uploading:', file.name),
  onUploadComplete: (file, url) => console.log('Uploaded:', url),
  onUploadError: (file, error) => console.error('Failed:', error),
  onFileDelete: (src, name, mimeType) => {
    // Clean up server-side resource
  },
  onFetchFile: async (src, mimeType) => {
    // Custom file fetcher for authenticated files
    const response = await fetch(src, { headers: { Authorization: 'Bearer ...' } })
    return await response.blob()
  },
  previewOptions: {
    csv: { maxRows: 1000, headerRow: true, freezeHeader: true },
    image: { allowZoom: true, showMetadata: true },
    text: { showLineNumbers: true, wordWrap: true },
  },
})

function MyEditor() {
  return <RichTextEditor plugins={[fileUploadPlugin]} />
}
```

This adds:
- `/file` slash command for inline attachments
- `/filecard` slash command for block attachments
- Toolbar button for file upload
- Drag-and-drop file upload
- File preview dialog (images, PDFs, CSVs, text files)

### Mention Plugin

Enable @mentions with user search:

```tsx
import { RichTextEditor, createMentionPlugin } from '@/components/ui/editor'

const mentionPlugin = createMentionPlugin({
  trigger: '@', // Default
  onSearch: async (query) => {
    // Search your user database
    const response = await fetch(`/api/users?q=${query}`)
    return await response.json() // Returns MentionItem[]
  },
  allowSpaces: false,
  minQueryLength: 1,
  maxSuggestions: 10,
  debounceMs: 150,
  noResultsText: 'No users found',
  loadingText: 'Searching...',
  onMentionSelect: (item) => console.log('Mentioned:', item),
  onMentionClick: (item, event) => {
    // Navigate to user profile
    window.location.href = `/users/${item.id}`
  },
})

function MyEditor() {
  return <RichTextEditor plugins={[mentionPlugin]} />
}
```

The `MentionItem` type:

```typescript
interface MentionItem {
  id: string
  label: string
  avatar?: string
  metadata?: Record<string, unknown>
}
```

## Custom Callouts

Define custom callout types with your own colors and icons:

```tsx
import { RichTextEditor, type CalloutTypeConfig } from '@/components/ui/editor'
import { Lightbulb, Bug, Rocket } from 'lucide-react'

const customCallouts: CalloutTypeConfig[] = [
  {
    id: 'tip',
    label: 'Tip',
    icon: Lightbulb,
    bgLight: 'hsl(280 100% 97%)',
    borderLight: 'hsl(280 100% 85%)',
    iconColorLight: 'hsl(280 100% 50%)',
    bgDark: 'hsl(280 50% 15%)',
    borderDark: 'hsl(280 50% 30%)',
    iconColorDark: 'hsl(280 100% 70%)',
  },
  {
    id: 'bug',
    label: 'Bug',
    icon: Bug,
    bgLight: 'hsl(0 100% 97%)',
    borderLight: 'hsl(0 70% 85%)',
    iconColorLight: 'hsl(0 70% 50%)',
    bgDark: 'hsl(0 50% 15%)',
    borderDark: 'hsl(0 50% 30%)',
    iconColorDark: 'hsl(0 70% 65%)',
  },
  // ... more types
]

function MyEditor() {
  return <RichTextEditor calloutTypes={customCallouts} />
}
```

Default callout types: `info`, `warning`, `error`, `success`

## Custom Plugin Development

Create your own plugins to extend the editor:

```typescript
import type { EditorPlugin, SlashCommand, ToolbarAction } from '@/components/ui/editor'
import { Sparkles } from 'lucide-react'

const myPlugin: EditorPlugin = {
  name: 'my-plugin',

  // Add slash commands
  slashCommands: [
    {
      name: 'Magic',
      description: 'Do something magical',
      icon: Sparkles,
      aliases: ['magic', 'sparkle'],
      group: 'custom',
      action: (editor) => {
        editor.chain().focus().insertContent('✨ Magic! ✨').run()
      },
    },
  ],

  // Add toolbar buttons
  toolbarActions: [
    {
      id: 'magic',
      icon: Sparkles,
      label: 'Magic',
      isActive: (editor) => false,
      action: (editor) => {
        editor.chain().focus().insertContent('✨').run()
      },
    },
  ],

  // Add Tiptap extensions
  extensions: [
    // Your custom extensions...
  ],

  // Lifecycle hooks
  onInit: (editor) => {
    console.log('Plugin initialized')
  },
  onDestroy: () => {
    console.log('Plugin destroyed')
  },
}
```

## Exports

```typescript
// Components
export { RichTextEditor } from './editor'
export { RichTextViewer } from './viewer'

// Types
export type {
  RichTextEditorProps,
  RichTextEditorRef,
  RichTextViewerProps,
  EditorContent,
  EditorContentFormat,
  SlashCommand,
  SlashCommandGroup,
  ToolbarAction,
  EditorPlugin,
  MentionItem,
  CalloutTypeConfig,
  FileAttachmentAttributes,
}

// Plugins
export { createFileUploadPlugin, createMentionPlugin }

// Utilities
export { defaultSlashCommands, filterCommands, groupCommands }
export { createExtensions }
export { DEFAULT_CALLOUT_TYPES }
```

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Run linter
bun run lint

# Build shadcn registry
bun run registry:build

# Build registry in watch mode
bun run registry:dev
```

## Tech Stack

- [Tiptap 3.x](https://tiptap.dev/) - Headless editor framework
- [React 19](https://react.dev/) - UI library
- [TypeScript 5.x](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [lowlight](https://github.com/wooorm/lowlight) - Syntax highlighting
- [Lucide React](https://lucide.dev/) - Icons
- [tippy.js](https://atomiks.github.io/tippyjs/) - Tooltips and popovers

## License

MIT

## Author

[Al Baktiar](https://github.com/abaktiar)
