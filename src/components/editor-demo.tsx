import { useState, useRef, useMemo, useEffect } from 'react'
import {
  RichTextEditor,
  RichTextViewer,
  type RichTextEditorRef,
  type EditorContent,
  createFileUploadPlugin,
  createMentionPlugin,
} from '@/components/ui/editor'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Moon,
  Sun,
  Type,
  Code,
  Eye,
  Pencil,
  Terminal,
  Zap,
  Paperclip,
  AtSign,
  ArrowRight,
  Github,
  Copy,
  Check,
  Sparkles,
  Layers,
  MousePointer2,
  Braces,
  FileText,
  Download,
  Upload,
  Play,
  Trash2,
  FileCode,
  Wand2,
} from 'lucide-react'

// Sample users for mention demo
const sampleUsers = [
  { id: '1', label: 'John Doe', avatar: 'https://i.pravatar.cc/150?u=john' },
  { id: '2', label: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=jane' },
  { id: '3', label: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alex' },
  { id: '4', label: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: '5', label: 'Mike Brown', avatar: 'https://i.pravatar.cc/150?u=mike' },
  { id: '6', label: 'Emily Davis', avatar: 'https://i.pravatar.cc/150?u=emily' },
  { id: '7', label: 'Chris Taylor' },
  { id: '8', label: 'Amanda Lee', avatar: 'https://i.pravatar.cc/150?u=amanda' },
]

// Demo content showcasing all editor features
const demoContent = `
<h1>Rich Text Editor Demo</h1>
<p>This editor supports <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, and <code>inline code</code>. You can also add <a href="https://github.com">links</a> and <mark>highlighted text</mark>.</p>

<h2>Text Formatting</h2>
<p>Select any text to see the bubble menu with formatting options. Use keyboard shortcuts like <code>Cmd+B</code> for bold, <code>Cmd+I</code> for italic, or <code>Cmd+K</code> to add links.</p>

<h3>Lists</h3>
<p>Bullet lists for unordered items:</p>
<ul>
  <li>First item with some content</li>
  <li>Second item with <strong>bold text</strong></li>
  <li>Third item with a <a href="#">link</a></li>
</ul>

<p>Numbered lists for sequential steps:</p>
<ol>
  <li>Install the editor component</li>
  <li>Import it into your React app</li>
  <li>Customize to your needs</li>
</ol>

<h3>Task Lists</h3>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true">Design the interface</li>
  <li data-type="taskItem" data-checked="true">Implement core features</li>
  <li data-type="taskItem" data-checked="false">Write documentation</li>
  <li data-type="taskItem" data-checked="false">Ship to production</li>
</ul>

<h2>Blockquote</h2>
<blockquote>
  <p>"The details are not the details. They make the design." — Charles Eames</p>
</blockquote>

<h2>Code Block</h2>
<p>Syntax highlighted code with language selection:</p>
<pre><code class="language-typescript">import { RichTextEditor } from '@/components/ui/editor'

interface Props {
  initialContent?: string
  onSave: (content: string) => void
}

export function MyEditor({ initialContent, onSave }: Props) {
  const [content, setContent] = useState(initialContent ?? '')

  return (
    <RichTextEditor
      content={content}
      onChange={(c) => setContent(c.html ?? '')}
      placeholder="Start writing..."
    />
  )
}</code></pre>

<h2>Table</h2>
<p>Tables with resizable columns and row/column controls:</p>
<table>
  <tbody>
    <tr>
      <th>Feature</th>
      <th>Status</th>
      <th>Notes</th>
    </tr>
    <tr>
      <td>Rich Text</td>
      <td>✅ Complete</td>
      <td>Bold, italic, underline, etc.</td>
    </tr>
    <tr>
      <td>Slash Commands</td>
      <td>✅ Complete</td>
      <td>Type / to open menu</td>
    </tr>
    <tr>
      <td>@Mentions</td>
      <td>✅ Complete</td>
      <td>Type @ to mention users</td>
    </tr>
    <tr>
      <td>File Attachments</td>
      <td>✅ Complete</td>
      <td>Drag & drop support</td>
    </tr>
  </tbody>
</table>

<h2>Callouts</h2>
<p>Highlight important information with callouts:</p>
<div data-type="callout" data-callout-type="info">
  <p><strong>Info:</strong> Use callouts to draw attention to important information. Type <code>/callout</code> to insert one.</p>
</div>

<div data-type="callout" data-callout-type="warning">
  <p><strong>Warning:</strong> Be careful with this action. It cannot be undone!</p>
</div>

<div data-type="callout" data-callout-type="success">
  <p><strong>Success:</strong> Your changes have been saved successfully.</p>
</div>

<h2>Toggle / Collapsible</h2>
<details data-type="toggle">
  <summary>Click to expand this section</summary>
  <p>This content is hidden by default and revealed when you click the toggle. Great for FAQs, additional details, or keeping your document organized.</p>
  <ul>
    <li>Nested content works too</li>
    <li>Including lists and other elements</li>
  </ul>
</details>

<hr>

<h2>Try It Yourself!</h2>
<p>This editor is fully interactive. Try these actions:</p>
<ul>
  <li>Type <code>/</code> at the start of a line for slash commands</li>
  <li>Type <code>@</code> to mention someone</li>
  <li>Select text to see the formatting toolbar</li>
  <li>Drag and drop files to attach them</li>
  <li>Click on a table to see row/column controls</li>
</ul>
`

const installCommand = 'npx shadcn@latest add https://abaktiar.github.io/rich-text-editor/r/rich-text-editor.json'

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={`p-2 rounded-md bg-foreground/5 hover:bg-foreground/10 transition-colors ${className ?? ''}`}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  )
}

// Output Inspector Component
type OutputFormat = 'html' | 'json' | 'text'
type InspectorMode = 'output' | 'import'

function OutputInspector({
  content,
  onImport,
}: {
  content: EditorContent
  onImport: (content: string, format: 'html' | 'json') => void
}) {
  const [activeTab, setActiveTab] = useState<OutputFormat>('html')
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('output')
  const [importText, setImportText] = useState('')
  const [detectedFormat, setDetectedFormat] = useState<'html' | 'json' | 'unknown'>('unknown')

  // Detect format when import text changes
  useEffect(() => {
    if (!importText.trim()) {
      setDetectedFormat('unknown')
      return
    }
    const trimmed = importText.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed)
        setDetectedFormat('json')
      } catch {
        setDetectedFormat('unknown')
      }
    } else if (trimmed.startsWith('<') || trimmed.includes('</')) {
      setDetectedFormat('html')
    } else {
      setDetectedFormat('unknown')
    }
  }, [importText])

  const getOutputContent = (format: OutputFormat): string => {
    switch (format) {
      case 'html':
        return content.html ?? ''
      case 'json':
        return content.json ? JSON.stringify(content.json, null, 2) : ''
      case 'text':
        return content.text ?? ''
    }
  }

  const getStats = (format: OutputFormat) => {
    const text = getOutputContent(format)
    const chars = text.length
    const lines = text.split('\n').length
    return { chars, lines }
  }

  const handleRender = () => {
    if (importText.trim()) {
      const format = detectedFormat === 'json' ? 'json' : 'html'
      onImport(importText.trim(), format)
      setInspectorMode('output')
      setImportText('')
    }
  }

  const tabs = [
    { id: 'html' as OutputFormat, label: 'HTML', icon: Code },
    { id: 'json' as OutputFormat, label: 'JSON', icon: Braces },
    { id: 'text' as OutputFormat, label: 'Text', icon: FileText },
  ]

  return (
    <section className='py-16 px-6'>
      <div className='max-w-5xl mx-auto'>
        {/* Section Header */}
        <div className='text-center mb-10'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4 font-[family-name:var(--font-display)]'>
            Output Inspector
          </h2>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            See exactly what your editor outputs in real-time. Copy the format you need, or import content to render.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className='flex justify-center mb-8'>
          <div className='inline-flex items-center gap-1 p-1.5 rounded-xl bg-muted/50 border border-border/50 backdrop-blur-sm'>
            <button
              onClick={() => setInspectorMode('output')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                inspectorMode === 'output'
                  ? 'bg-background shadow-md text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <Download className='w-4 h-4' />
              Output
            </button>
            <button
              onClick={() => setInspectorMode('import')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                inspectorMode === 'import'
                  ? 'bg-background shadow-md text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <Upload className='w-4 h-4' />
              Import
            </button>
          </div>
        </div>

        {/* Main Container */}
        <div className='relative group'>
          {/* Glow effect */}
          <div className='absolute -inset-3 bg-gradient-to-r from-demo-warm/10 via-transparent to-demo-warm/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700' />

          {/* Glass card */}
          <div className='relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl shadow-foreground/5 overflow-hidden'>
            {inspectorMode === 'output' ? (
              <>
                {/* Tab Bar */}
                <div className='flex items-center justify-between border-b border-border/50 bg-muted/30'>
                  <div className='flex'>
                    {tabs.map((tab, index) => {
                      const stats = getStats(tab.id)
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id

                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            'relative flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all duration-300',
                            isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                            index > 0 && 'border-l border-border/30'
                          )}
                        >
                          <Icon className={cn('w-4 h-4 transition-colors', isActive && 'text-demo-warm')} />
                          <span>{tab.label}</span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs transition-colors',
                              isActive
                                ? 'bg-demo-warm/20 text-demo-warm'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {stats.chars.toLocaleString()}
                          </span>
                          {/* Active indicator */}
                          {isActive && (
                            <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-demo-warm to-transparent' />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Copy button */}
                  <div className='px-4'>
                    <CopyButton text={getOutputContent(activeTab)} className='hover:bg-demo-warm/10' />
                  </div>
                </div>

                {/* Content Area */}
                <div className='relative'>
                  {/* Line count gutter */}
                  <div className='absolute left-0 top-0 bottom-0 w-12 bg-muted/20 border-r border-border/30 flex flex-col items-end pr-2 pt-4 text-xs text-muted-foreground/50 font-mono select-none overflow-hidden'>
                    {getOutputContent(activeTab)
                      .split('\n')
                      .slice(0, 100)
                      .map((_, i) => (
                        <div key={i} className='h-5 leading-5'>
                          {i + 1}
                        </div>
                      ))}
                  </div>

                  {/* Code content */}
                  <div className='pl-14 pr-4 py-4 overflow-auto max-h-[400px] min-h-[200px]'>
                    <pre className='text-sm font-mono leading-5 whitespace-pre-wrap break-all'>
                      <code className='text-foreground/90'>{getOutputContent(activeTab)}</code>
                    </pre>
                  </div>

                  {/* Fade overlay at bottom */}
                  <div className='absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/80 to-transparent pointer-events-none' />
                </div>

                {/* Stats Footer */}
                <div className='px-5 py-3 border-t border-border/30 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground'>
                  <div className='flex items-center gap-4'>
                    <span className='flex items-center gap-1.5'>
                      <FileCode className='w-3.5 h-3.5' />
                      {getStats(activeTab).lines.toLocaleString()} lines
                    </span>
                    <span className='flex items-center gap-1.5'>
                      <Type className='w-3.5 h-3.5' />
                      {getStats(activeTab).chars.toLocaleString()} characters
                    </span>
                  </div>
                  <span className='text-muted-foreground/60'>Live output from editor</span>
                </div>
              </>
            ) : (
              /* Import Mode */
              <div className='p-6'>
                {/* Import Header */}
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-demo-warm/20 to-demo-warm/5 flex items-center justify-center'>
                      <Wand2 className='w-5 h-5 text-demo-warm' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-foreground'>Import Content</h3>
                      <p className='text-sm text-muted-foreground'>Paste HTML or JSON to render in the viewer</p>
                    </div>
                  </div>

                  {/* Format detector badge */}
                  {importText.trim() && (
                    <div
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300',
                        detectedFormat === 'html' && 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                        detectedFormat === 'json' && 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
                        detectedFormat === 'unknown' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {detectedFormat === 'html' && <Code className='w-3.5 h-3.5' />}
                      {detectedFormat === 'json' && <Braces className='w-3.5 h-3.5' />}
                      {detectedFormat === 'unknown' && <FileText className='w-3.5 h-3.5' />}
                      {detectedFormat === 'html' && 'HTML detected'}
                      {detectedFormat === 'json' && 'JSON detected'}
                      {detectedFormat === 'unknown' && 'Format unknown'}
                    </div>
                  )}
                </div>

                {/* Textarea */}
                <div className='relative mb-4'>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder='Paste your HTML or JSON content here...'
                    className={cn(
                      'w-full h-64 px-4 py-3 rounded-xl border bg-background/50 text-sm font-mono resize-none transition-all duration-300',
                      'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-demo-warm/50 focus:border-demo-warm/50',
                      'border-border/50 hover:border-border'
                    )}
                  />
                  {/* Character count */}
                  <div className='absolute bottom-3 right-3 text-xs text-muted-foreground/50'>
                    {importText.length.toLocaleString()} chars
                  </div>
                </div>

                {/* Action buttons */}
                <div className='flex items-center gap-3'>
                  <Button
                    onClick={handleRender}
                    disabled={!importText.trim()}
                    className='flex-1 gap-2 h-11'
                  >
                    <Play className='w-4 h-4' />
                    Render in Viewer
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => setImportText('')}
                    disabled={!importText}
                    className='gap-2 h-11 px-6'
                  >
                    <Trash2 className='w-4 h-4' />
                    Clear
                  </Button>
                </div>

                {/* Example snippets */}
                <div className='mt-6 pt-6 border-t border-border/30'>
                  <p className='text-xs text-muted-foreground mb-3'>Quick examples:</p>
                  <div className='flex flex-wrap gap-2'>
                    <button
                      onClick={() =>
                        setImportText('<h1>Hello World</h1>\n<p>This is a <strong>test</strong> paragraph.</p>')
                      }
                      className='px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors'
                    >
                      Simple HTML
                    </button>
                    <button
                      onClick={() =>
                        setImportText(
                          JSON.stringify(
                            {
                              type: 'doc',
                              content: [
                                { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Hello' }] },
                                { type: 'paragraph', content: [{ type: 'text', text: 'World' }] },
                              ],
                            },
                            null,
                            2
                          )
                        )
                      }
                      className='px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors'
                    >
                      Tiptap JSON
                    </button>
                    <button
                      onClick={() =>
                        setImportText(
                          '<ul>\n  <li>First item</li>\n  <li>Second item</li>\n  <li>Third item</li>\n</ul>'
                        )
                      }
                      className='px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors'
                    >
                      List HTML
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: typeof Type
  title: string
  description: string
  delay: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-border transition-all duration-500 hover:shadow-lg hover:shadow-foreground/5 ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-demo-warm/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-demo-warm/20 to-demo-warm/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5 text-demo-warm" />
        </div>
        <h3 className="font-semibold text-lg mb-2 font-[family-name:var(--font-display)]">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export function EditorDemo() {
  const [isDark, setIsDark] = useState(true)
  const [mode, setMode] = useState<'edit' | 'view'>('edit')
  const [content, setContent] = useState<EditorContent>({ html: demoContent })
  const [isEditorReady, setIsEditorReady] = useState(false)
  const editorRef = useRef<RichTextEditorRef>(null)

  // Set dark mode on mount
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  // Sync all content formats when editor initializes
  useEffect(() => {
    if (isEditorReady && editorRef.current) {
      const editor = editorRef.current.getEditor()
      if (editor) {
        setContent({
          html: editor.getHTML(),
          json: editor.getJSON(),
          text: editor.getText(),
        })
      }
    }
  }, [isEditorReady])

  // Check for editor ready state
  useEffect(() => {
    const checkEditor = setInterval(() => {
      if (editorRef.current?.getEditor()) {
        setIsEditorReady(true)
        clearInterval(checkEditor)
      }
    }, 50)
    return () => clearInterval(checkEditor)
  }, [])

  // Create file upload plugin
  const fileUploadPlugin = useMemo(
    () =>
      createFileUploadPlugin({
        onUpload: async (file) => {
          // Read file to data URL
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
          })
          // Simulate server upload delay based on file size
          // Small files (<100KB): 800ms, medium (<1MB): 1.5s, large: 2.5s
          const delay = file.size < 100 * 1024 ? 800 : file.size < 1024 * 1024 ? 1500 : 2500
          await new Promise((r) => setTimeout(r, delay))
          return dataUrl
        },
        accept: ['image/*', 'application/pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.json'],
        maxSize: 10 * 1024 * 1024,
        displayModeByType: {
          'image/*': 'block',
          'application/pdf': 'block',
        },
        previewOptions: {
          csv: { showRowNumbers: true, alternateRowColors: true, maxRows: 500, delimiter: 'auto' },
          text: { showLineNumbers: true, fontSize: 13 },
          image: { allowZoom: true, showMetadata: true, transparentBackground: 'checkerboard' },
        },
      }),
    []
  )

  // Mention click handler
  const handleMentionClick = (item: { id: string; label: string }) => {
    alert(`Clicked on @${item.label}`)
  }

  // Create mention plugin
  const mentionPlugin = useMemo(
    () =>
      createMentionPlugin({
        onSearch: async (query) => {
          await new Promise((r) => setTimeout(r, 100))
          return sampleUsers.filter((u) =>
            u.label.toLowerCase().includes(query.toLowerCase())
          )
        },
        onMentionSelect: (item) => console.log('Mentioned:', item.label),
        onMentionClick: handleMentionClick,
      }),
    []
  )

  const toggleTheme = () => {
    setIsDark((prev) => !prev)
    document.documentElement.classList.toggle('dark')
  }

  const features = [
    {
      icon: Type,
      title: 'Rich Formatting',
      description: 'Bold, italic, underline, strikethrough, code, and more. Everything you need for expressive writing.',
    },
    {
      icon: Terminal,
      title: 'Slash Commands',
      description: 'Type "/" anywhere to access all block types. Fast, intuitive, keyboard-first.',
    },
    {
      icon: Layers,
      title: 'Block Types',
      description: 'Headings, lists, quotes, code blocks, images, tables, callouts, and toggles.',
    },
    {
      icon: Zap,
      title: 'Keyboard Shortcuts',
      description: 'Muscle memory friendly. Cmd+B, Cmd+I, Cmd+K, and many more standard shortcuts.',
    },
    {
      icon: Paperclip,
      title: 'File Attachments',
      description: 'Drag and drop files. Preview CSVs, images, PDFs, and more directly in the editor.',
    },
    {
      icon: AtSign,
      title: '@Mentions',
      description: 'Type "@" to mention users. Async search support with customizable suggestion list.',
    },
    {
      icon: MousePointer2,
      title: 'Bubble Menu',
      description: 'Select text to reveal formatting options. Context-aware and unobtrusive.',
    },
    {
      icon: Sparkles,
      title: 'Plugin System',
      description: 'Extend with custom blocks, commands, and toolbar actions. Fully typed API.',
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'TypeScript first. Full API access. Controlled and uncontrolled modes.',
    },
  ]

  return (
    <div className='min-h-screen bg-background text-foreground overflow-x-hidden'>
      {/* Grain overlay */}
      <div className='grain-overlay' />

      {/* Header */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50'>
        <div className='max-w-6xl mx-auto px-6 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <svg
              width='36'
              height='36'
              viewBox='0 0 32 32'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='rounded-lg'>
              <rect width='32' height='32' rx='8' fill='currentColor' className='text-foreground' />
              <path
                d='M8 10h16M8 16h12M8 22h14'
                stroke='currentColor'
                className='text-background'
                strokeWidth='2.5'
                strokeLinecap='round'
              />
              <circle cx='24' cy='22' r='3' className='fill-demo-warm' />
            </svg>
            <span className='font-semibold tracking-tight font-[family-name:var(--font-display)]'>
              Rich Text Editor
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <a
              href='https://github.com/abaktiar/rich-text-editor'
              target='_blank'
              rel='noopener noreferrer'
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'inline-flex items-center gap-2 text-muted-foreground hover:text-foreground',
              )}>
              <Github className='w-4 h-4' />
              <span className='hidden sm:inline'>GitHub</span>
            </a>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleTheme}
              className='text-muted-foreground hover:text-foreground'>
              {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='pt-32 pb-20 px-6'>
        <div className='max-w-4xl mx-auto text-center'>
          <div className='animate-fade-in-up'>
            <p className='text-demo-warm font-medium tracking-wide uppercase text-sm mb-6'>
              Open Source · React · Tiptap
            </p>
          </div>

          <h1 className='animate-fade-in-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 font-[family-name:var(--font-display)] leading-[1.1]'>
            A beautiful editor
            <br />
            <span className='text-muted-foreground'>for beautiful words</span>
          </h1>

          <p className='animate-fade-in-up delay-200 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed'>
            A modern, extensible rich text editor component. Built with Tiptap, styled with shadcn/ui, and designed for
            developers who care about the details.
          </p>

          <div className='animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center mb-12'>
            <a
              href='#demo'
              className={cn(buttonVariants({ size: 'lg' }), 'inline-flex items-center gap-2 px-6 h-12 text-base')}>
              Try the Demo
              <ArrowRight className='w-4 h-4' />
            </a>
            <a
              href='https://github.com/abaktiar/rich-text-editor'
              target='_blank'
              rel='noopener noreferrer'
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'inline-flex items-center gap-2 px-6 h-12 text-base',
              )}>
              <Github className='w-4 h-4' />
              View on GitHub
            </a>
          </div>

          {/* Install command */}
          <div className='animate-fade-in-up delay-400 max-w-4xl mx-auto'>
            <div className='relative group'>
              <div className='absolute -inset-1 bg-gradient-to-r from-demo-warm/20 via-demo-warm/10 to-demo-warm/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
              <div className='relative bg-card border border-border rounded-xl flex items-center'>
                <div className='flex-1 p-4 overflow-x-auto font-mono text-sm'>
                  <code className='text-muted-foreground whitespace-nowrap'>{installCommand}</code>
                </div>
                <div className='flex-shrink-0 p-2 bg-card'>
                  <CopyButton text={installCommand} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className='py-20 px-6 bg-muted/30'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4 font-[family-name:var(--font-display)]'>
              Everything you need
            </h2>
            <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
              A complete editing experience, thoughtfully designed and meticulously built.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 75} />
            ))}
          </div>
        </div>
      </section>

      {/* Editor Demo */}
      <section id='demo' className='py-20 px-6 scroll-mt-20'>
        <div className='max-w-5xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4 font-[family-name:var(--font-display)]'>
              Try it yourself
            </h2>
            <p className='text-muted-foreground text-lg'>
              Type <code className='px-1.5 py-0.5 rounded bg-muted text-sm'>/</code> to open commands, or{' '}
              <code className='px-1.5 py-0.5 rounded bg-muted text-sm'>@</code> to mention someone.
            </p>
          </div>

          {/* Mode toggle */}
          <div className='flex justify-center mb-6'>
            <div className='inline-flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50'>
              <button
                onClick={() => setMode('edit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'edit'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                <Pencil className='w-4 h-4' />
                Edit
              </button>
              <button
                onClick={() => setMode('view')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'view'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                <Eye className='w-4 h-4' />
                Preview
              </button>
            </div>
          </div>

          {/* Editor container */}
          <div className='relative group'>
            <div className='absolute -inset-3 bg-gradient-to-r from-demo-warm/10 via-transparent to-demo-warm/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700' />
            <div className='relative bg-card border border-border rounded-2xl shadow-xl shadow-foreground/5 overflow-hidden'>
              {mode === 'edit' ? (
                <RichTextEditor
                  ref={editorRef}
                  content={content.html}
                  onChange={setContent}
                  placeholder="Type '/' for commands..."
                  minHeight='600px'
                  codeBlockMaxHeight={400}
                  className='border-0'
                  plugins={[fileUploadPlugin, mentionPlugin]}
                />
              ) : (
                <RichTextViewer
                  content={content.html ?? ''}
                  className='border-0 min-h-[600px]'
                  codeBlockMaxHeight={400}
                  onMentionClick={handleMentionClick}
                />
              )}
            </div>
          </div>

          <p className='text-center text-sm text-muted-foreground mt-6'>
            Tip: Try <code className='px-1.5 py-0.5 rounded bg-muted text-xs'>/code</code> for syntax highlighted code
            blocks, <code className='px-1.5 py-0.5 rounded bg-muted text-xs'>/table</code> for tables, or{' '}
            <code className='px-1.5 py-0.5 rounded bg-muted text-xs'>/callout</code> for callouts.
          </p>
        </div>
      </section>

      {/* Output Inspector */}
      <OutputInspector
        content={content}
        onImport={(importedContent, format) => {
          if (format === 'json') {
            try {
              const parsed = JSON.parse(importedContent)
              setContent({ html: undefined, json: parsed, text: undefined })
              // Update editor with JSON content
              editorRef.current?.setContent(parsed)
            } catch {
              // Fallback to HTML if JSON parsing fails
              setContent({ html: importedContent, json: undefined, text: undefined })
            }
          } else {
            setContent({ html: importedContent, json: undefined, text: undefined })
          }
          setMode('view')
        }}
      />

      {/* Code Example */}
      <section className='py-20 px-6 bg-muted/30'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4 font-[family-name:var(--font-display)]'>
              Simple to integrate
            </h2>
            <p className='text-muted-foreground text-lg'>
              Drop it into your React project. Customize to your heart's content.
            </p>
          </div>

          <div className='relative'>
            <div className='absolute -inset-4 bg-gradient-to-b from-demo-warm/10 to-transparent rounded-3xl blur-2xl opacity-50' />
            <div className='relative bg-[#1a1815] dark:bg-[#0d0c0a] rounded-2xl p-6 overflow-x-auto border border-white/5'>
              <pre className='text-sm leading-relaxed'>
                <code className='text-[#f5f2ed]'>
                  <span className='text-[#7aa2f7]'>import</span>
                  <span className='text-[#f5f2ed]'>{' { '}</span>
                  <span className='text-[#c4a07a]'>RichTextEditor</span>
                  <span className='text-[#f5f2ed]'>{' } '}</span>
                  <span className='text-[#7aa2f7]'>from</span>
                  <span className='text-[#9ece6a]'> '@/components/ui/editor'</span>
                  {'\n\n'}
                  <span className='text-[#7aa2f7]'>export function</span>
                  <span className='text-[#bb9af7]'> MyEditor</span>
                  <span className='text-[#f5f2ed]'>() {'{'}</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'  '}</span>
                  <span className='text-[#7aa2f7]'>const</span>
                  <span className='text-[#f5f2ed]'> [</span>
                  <span className='text-[#c4a07a]'>content</span>
                  <span className='text-[#f5f2ed]'>, </span>
                  <span className='text-[#c4a07a]'>setContent</span>
                  <span className='text-[#f5f2ed]'>] = </span>
                  <span className='text-[#bb9af7]'>useState</span>
                  <span className='text-[#f5f2ed]'>(</span>
                  <span className='text-[#9ece6a]'>''</span>
                  <span className='text-[#f5f2ed]'>)</span>
                  {'\n\n'}
                  <span className='text-[#f5f2ed]'>{'  '}</span>
                  <span className='text-[#7aa2f7]'>return</span>
                  <span className='text-[#f5f2ed]'> (</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'    '}&lt;</span>
                  <span className='text-[#bb9af7]'>RichTextEditor</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'      '}</span>
                  <span className='text-[#c4a07a]'>content</span>
                  <span className='text-[#f5f2ed]'>={'{'}</span>
                  <span className='text-[#c4a07a]'>content</span>
                  <span className='text-[#f5f2ed]'>{'}'}</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'      '}</span>
                  <span className='text-[#c4a07a]'>onChange</span>
                  <span className='text-[#f5f2ed]'>={'{'}</span>
                  <span className='text-[#f5f2ed]'>(</span>
                  <span className='text-[#c4a07a]'>c</span>
                  <span className='text-[#f5f2ed]'>) </span>
                  <span className='text-[#7aa2f7]'>=&gt;</span>
                  <span className='text-[#f5f2ed]'> </span>
                  <span className='text-[#bb9af7]'>setContent</span>
                  <span className='text-[#f5f2ed]'>(</span>
                  <span className='text-[#c4a07a]'>c</span>
                  <span className='text-[#f5f2ed]'>.</span>
                  <span className='text-[#c4a07a]'>html</span>
                  <span className='text-[#f5f2ed]'>){'}'}</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'      '}</span>
                  <span className='text-[#c4a07a]'>placeholder</span>
                  <span className='text-[#f5f2ed]'>=</span>
                  <span className='text-[#9ece6a]'>"Start writing..."</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'    '}/&gt;</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'  '})</span>
                  {'\n'}
                  <span className='text-[#f5f2ed]'>{'}'}</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-24 px-6'>
        <div className='max-w-3xl mx-auto text-center'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-6 font-[family-name:var(--font-display)]'>
            Ready to get started?
          </h2>
          <p className='text-muted-foreground text-lg mb-10 max-w-xl mx-auto'>
            Install the editor with a single command. Full documentation and examples available on GitHub.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <a
              href='https://github.com/abaktiar/rich-text-editor'
              target='_blank'
              rel='noopener noreferrer'
              className={cn(buttonVariants({ size: 'lg' }), 'inline-flex items-center gap-2 px-8 h-12 text-base')}>
              <Github className='w-4 h-4' />
              Get Started
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-8 px-6 border-t border-border/50'>
        <div className='max-w-6xl mx-auto flex flex-col items-center gap-4'>
          <p className='text-sm text-muted-foreground'>
            Built with{' '}
            <a
              href='https://tiptap.dev'
              className='underline underline-offset-4 hover:text-foreground transition-colors'
              target='_blank'
              rel='noopener noreferrer'>
              Tiptap
            </a>
            {' + '}
            <a
              href='https://ui.shadcn.com'
              className='underline underline-offset-4 hover:text-foreground transition-colors'
              target='_blank'
              rel='noopener noreferrer'>
              shadcn/ui
            </a>
            {' · '}
            Open source under MIT License
          </p>
          <p className='text-sm text-muted-foreground'>
            Developed with <span className='text-demo-warm'>♥</span> by{' '}
            <a
              href='https://github.com/abaktiar'
              className='underline underline-offset-4 hover:text-foreground transition-colors'
              target='_blank'
              rel='noopener noreferrer'>
              Al Baktiar
            </a>
            {' & '}
            <a
              href='https://claude.ai/code'
              className='underline underline-offset-4 hover:text-foreground transition-colors'
              target='_blank'
              rel='noopener noreferrer'>
              Claude Code
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
