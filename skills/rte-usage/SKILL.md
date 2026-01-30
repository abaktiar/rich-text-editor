---
name: rte-usage
description: Use RichTextEditor and RichTextViewer components from @abaktiar/rich-text-editor. Use when implementing rich text editing or displaying formatted content.
---

# Rich Text Editor Usage

## Installation

```bash
npx shadcn@latest add https://abaktiar.github.io/rich-text-editor/r/rich-text-editor.json
```

## Basic Usage

```tsx
import { RichTextEditor, RichTextViewer } from '@/components/ui/editor'

// Editable
<RichTextEditor
  content="<p>Hello world</p>"
  onChange={(content) => console.log(content.html)}
  placeholder="Type '/' for commands..."
/>

// Read-only
<RichTextViewer content={savedHtml} />
```

## RichTextEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string \| object` | - | Initial HTML or JSON |
| `onChange` | `(content) => void` | - | Content change callback |
| `editable` | `boolean` | `true` | Enable editing |
| `placeholder` | `string` | `"Type '/' for commands..."` | Placeholder text |
| `autoFocus` | `boolean` | `false` | Focus on mount |
| `className` | `string` | - | CSS classes |
| `showToolbar` | `boolean` | `true` | Show toolbar |
| `minHeight` | `string \| number` | `'200px'` | Min height |
| `codeBlockMaxHeight` | `string \| number` | - | Code block max height |
| `calloutTypes` | `CalloutTypeConfig[]` | defaults | Custom callouts |
| `plugins` | `EditorPlugin[]` | `[]` | Custom plugins |

## RichTextViewer Props

| Prop | Type | Description |
|------|------|-------------|
| `content` | `string \| object` | HTML or JSON to display |
| `className` | `string` | CSS classes |
| `onMentionClick` | `(item, event) => void` | Mention click handler |
| `codeBlockMaxHeight` | `string \| number` | Code block max height |

## Ref API

```tsx
import { useRef } from 'react'
import { RichTextEditor, type RichTextEditorRef } from '@/components/ui/editor'

function MyEditor() {
  const ref = useRef<RichTextEditorRef>(null)

  return (
    <>
      <RichTextEditor ref={ref} />
      <button onClick={() => console.log(ref.current?.getContent('html'))}>
        Get HTML
      </button>
    </>
  )
}
```

| Method | Returns | Description |
|--------|---------|-------------|
| `getContent(format)` | `string \| object` | Get as 'html', 'json', 'text' |
| `setContent(content)` | `void` | Set HTML or JSON |
| `focus()` | `void` | Focus editor |
| `blur()` | `void` | Blur editor |
| `isEmpty()` | `boolean` | Check if empty |
| `clear()` | `void` | Clear content |
| `getEditor()` | `Editor` | Get Tiptap instance |

## onChange Content

```tsx
interface EditorContent {
  html: string   // HTML string
  json: object   // Tiptap JSON
  text: string   // Plain text
}
```

## All Exports

```tsx
// Components
import {
  RichTextEditor,
  RichTextViewer,
  BubbleMenu,
  CommandMenu,
  Toolbar,
} from '@/components/ui/editor'

// Plugins
import {
  createFileUploadPlugin,
  createMentionPlugin,
} from '@/components/ui/editor'

// Utilities
import {
  defaultSlashCommands,
  filterCommands,
  groupCommands,
  commandGroups,
  createExtensions,
} from '@/components/ui/editor'

// Types
import type {
  RichTextEditorRef,
  RichTextEditorProps,
  EditorPlugin,
  SlashCommand,
  ToolbarAction,
  MentionItem,
  CalloutTypeConfig,
} from '@/components/ui/editor'
```
