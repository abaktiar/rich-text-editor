---
name: rte-customization
description: Customize Rich Text Editor appearance, callouts, and dimensions. Use when styling the editor or configuring callout types.
---

# Customizing Rich Text Editor

## Styling

```tsx
<RichTextEditor className="my-editor" />
```

```css
.my-editor {
  border: 2px solid var(--primary);
  border-radius: 12px;
}
```

## Dimensions

```tsx
// Min height
<RichTextEditor minHeight="400px" />
<RichTextEditor minHeight={400} />

// Code block max height (adds scrolling)
<RichTextEditor codeBlockMaxHeight="300px" />
<RichTextViewer codeBlockMaxHeight={200} content={content} />
```

## Default Callout Types

Built-in callouts (used when `calloutTypes` not specified):

| Type | Icon | Description |
|------|------|-------------|
| `info` | Info | Blue - informational |
| `warning` | AlertTriangle | Yellow - warnings |
| `error` | XCircle | Red - errors |
| `success` | CheckCircle | Green - success |

Access defaults:
```tsx
import { DEFAULT_CALLOUT_TYPES } from '@/components/ui/editor'
```

## Custom Callout Types

```tsx
import { RichTextEditor, type CalloutTypeConfig } from '@/components/ui/editor'
import { Lightbulb, Bug, Rocket } from 'lucide-react'

const customCallouts: CalloutTypeConfig[] = [
  {
    id: 'tip',
    label: 'Tip',
    icon: Lightbulb,
    bgLight: '#fef9c3',
    borderLight: '#facc15',
    iconColorLight: '#ca8a04',
    bgDark: '#422006',
    borderDark: '#a16207',
    iconColorDark: '#fbbf24',
  },
  {
    id: 'bug',
    label: 'Bug',
    icon: Bug,
    bgLight: '#fee2e2',
    borderLight: '#ef4444',
    iconColorLight: '#dc2626',
    bgDark: '#450a0a',
    borderDark: '#b91c1c',
    iconColorDark: '#f87171',
  },
]

<RichTextEditor calloutTypes={customCallouts} />
```

### CalloutTypeConfig

```tsx
interface CalloutTypeConfig {
  id: string              // Unique ID
  label: string           // Dropdown label
  icon: LucideIcon        // Lucide icon
  bgLight?: string        // Light background
  borderLight?: string    // Light border
  iconColorLight?: string // Light icon color
  bgDark?: string         // Dark background
  borderDark?: string     // Dark border
  iconColorDark?: string  // Dark icon color
}
```

## Toolbar

```tsx
// Show (default in edit mode)
<RichTextEditor showToolbar={true} />

// Hide
<RichTextEditor showToolbar={false} />

// Auto-hidden when not editable
<RichTextEditor editable={false} />
```

## CSS Variables

Override shadcn/ui tokens:

```css
.rich-text-editor {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --border: 0 0% 89.8%;
}
```
