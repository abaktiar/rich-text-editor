---
name: rte-plugins
description: Use Rich Text Editor plugins for @mentions and file uploads. Use when implementing mentions, file attachments, or creating custom plugins.
---

# Plugins

## Mention Plugin

```tsx
import {
  RichTextEditor,
  createMentionPlugin,
  type MentionItem,
} from '@/components/ui/editor'

const users: MentionItem[] = [
  { id: '1', label: 'John Doe', avatar: 'https://...' },
  { id: '2', label: 'Jane Smith' },
]

const mentionPlugin = createMentionPlugin({
  onSearch: async (query) => {
    return users.filter(u =>
      u.label.toLowerCase().includes(query.toLowerCase())
    )
  },
})

<RichTextEditor plugins={[mentionPlugin]} />
```

### MentionPluginOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onSearch` | `(query) => MentionItem[]` | required | Search handler |
| `trigger` | `string` | `'@'` | Trigger character |
| `allowSpaces` | `boolean` | `false` | Allow spaces in query |
| `minQueryLength` | `number` | `0` | Min chars to search |
| `maxSuggestions` | `number` | `10` | Max dropdown items |
| `debounceMs` | `number` | `150` | Search debounce |
| `noResultsText` | `string` | `'No results found'` | Empty state text |
| `loadingText` | `string` | `'Searching...'` | Loading text |
| `renderItem` | `(item, selected) => ReactNode` | - | Custom item render |
| `renderMention` | `(item) => ReactNode` | - | Custom mention render |
| `onMentionSelect` | `(item) => void` | - | Selection callback |
| `onMentionRemove` | `(item) => void` | - | Removal callback |
| `onMentionClick` | `(item, event) => void` | - | Click callback |

## File Upload Plugin

```tsx
import {
  RichTextEditor,
  createFileUploadPlugin,
} from '@/components/ui/editor'

const filePlugin = createFileUploadPlugin({
  onUpload: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const { url } = await res.json()
    return url
  },
})

<RichTextEditor plugins={[filePlugin]} />
```

### FileUploadPluginOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onUpload` | `(file) => Promise<string>` | required | Upload handler, returns URL |
| `accept` | `string[]` | - | Allowed types `['image/*', '.pdf']` |
| `maxSize` | `number` | `10MB` | Max file size in bytes |
| `defaultDisplayMode` | `'block' \| 'inline'` | `'inline'` | Default display |
| `displayModeByType` | `Record<string, 'block'\|'inline'>` | - | Per-type display |
| `onUploadStart` | `(file) => void` | - | Upload started |
| `onUploadComplete` | `(file, url) => void` | - | Upload succeeded |
| `onUploadError` | `(file, error) => void` | - | Upload failed |
| `onFileDelete` | `(src, name, mimeType) => void` | - | File deleted |
| `onFetchFile` | `(src, mimeType) => Promise<string\|Blob>` | - | Custom file fetcher |
| `previewOptions` | `PreviewOptions` | - | Preview customization |

### Display Mode by Type

```tsx
createFileUploadPlugin({
  onUpload: uploadFn,
  displayModeByType: {
    'image/*': 'block',
    'application/pdf': 'block',
    'text/*': 'inline',
    '*': 'inline',
  },
})
```

## Combining Plugins

```tsx
const plugins = [
  createMentionPlugin({ onSearch: searchUsers }),
  createFileUploadPlugin({ onUpload: uploadFile }),
]

<RichTextEditor plugins={plugins} />
```

## Custom Plugin

```tsx
import type { EditorPlugin, SlashCommand, ToolbarAction } from '@/components/ui/editor'

const myPlugin: EditorPlugin = {
  name: 'my-plugin',

  slashCommands: [{
    name: 'Custom',
    description: 'My command',
    icon: Sparkles,
    group: 'custom',
    action: (editor) => { /* ... */ },
  }],

  toolbarActions: [{
    id: 'custom-action',
    icon: Sparkles,
    label: 'Custom',
    isActive: (editor) => false,
    action: (editor) => { /* ... */ },
  }],

  extensions: [], // Tiptap extensions

  onInit: (editor) => { /* setup */ },
  onDestroy: () => { /* cleanup */ },
}
```

## MentionItem

```tsx
interface MentionItem {
  id: string
  label: string
  avatar?: string
  metadata?: Record<string, unknown>
}
```
