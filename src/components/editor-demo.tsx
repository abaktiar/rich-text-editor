import { useState, useRef, useMemo } from 'react'
import {
  RichTextEditor,
  RichTextViewer,
  type RichTextEditorRef,
  type EditorContent,
  createFileUploadPlugin,
  createMentionPlugin,
} from '@/components/ui/editor'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Moon,
  Sun,
  Type,
  Code,
  Eye,
  Pencil,
  Sparkles,
  Blocks,
  Terminal,
  Zap,
  Paperclip,
  AtSign,
} from 'lucide-react'

// Sample users for mention demo
const sampleUsers = [
  { id: '1', label: 'John Doe', avatar: 'https://i.pravatar.cc/150?u=john' },
  { id: '2', label: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=jane' },
  { id: '3', label: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alex' },
  { id: '4', label: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: '5', label: 'Mike Brown', avatar: 'https://i.pravatar.cc/150?u=mike' },
  { id: '6', label: 'Emily Davis', avatar: 'https://i.pravatar.cc/150?u=emily' },
  { id: '7', label: 'Chris Taylor' }, // No avatar
  { id: '8', label: 'Amanda Lee', avatar: 'https://i.pravatar.cc/150?u=amanda' },
]

// Demo content showcasing various features
const demoContent = `
<h1>Welcome to Rich Text Editor</h1>
<p>A modern editor built for React with <strong>full formatting</strong>, <em>slash commands</em>, and <u>extensibility</u>.</p>

<h2>✨ Features</h2>
<ul>
  <li>Type <code>/</code> to open the command menu</li>
  <li>Select text to see the formatting toolbar</li>
  <li>Use keyboard shortcuts like <code>Cmd+B</code> for bold</li>
</ul>

<h3>Task Lists</h3>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true">Create the editor component</li>
  <li data-type="taskItem" data-checked="true">Add slash commands</li>
  <li data-type="taskItem" data-checked="false">Add more plugins</li>
</ul>

<blockquote>
  <p>"The best editor is one that gets out of your way." — Every developer</p>
</blockquote>

<pre><code class="language-typescript">// Example usage
import { RichTextEditor } from '@/components/ui/editor'

function MyComponent() {
  return (
    &lt;RichTextEditor
      placeholder="Start typing..."
      onChange={(content) => console.log(content)}
    /&gt;
  )
}</code></pre>
`

export function EditorDemo() {
  const [isDark, setIsDark] = useState(false)
  const [mode, setMode] = useState<'edit' | 'view'>('edit')
  const [content, setContent] = useState<EditorContent>({ html: demoContent })
  const editorRef = useRef<RichTextEditorRef>(null)

  // Create file upload plugin with customizations
  const fileUploadPlugin = useMemo(
    () =>
      createFileUploadPlugin({
        onUpload: async (file) => {
          // Demo: convert file to base64 data URL
          // In production, you would upload to your server/CDN
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });
        },
        accept: ['image/*', 'application/pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.json'],
        maxSize: 10 * 1024 * 1024, // 10MB

        // Display mode by file type - images show as block by default
        displayModeByType: {
          'image/*': 'block',
          'application/pdf': 'block',
        },

        // Preview customizations
        previewOptions: {
          csv: {
            showRowNumbers: true,
            alternateRowColors: true,
            maxRows: 500,
            delimiter: 'auto',
          },
          text: {
            showLineNumbers: true,
            fontSize: 13,
          },
          image: {
            allowZoom: true,
            showMetadata: true,
            transparentBackground: 'checkerboard',
          },
        },

        onUploadStart: (file) => {
          console.log('Upload started:', file.name);
        },
        onUploadComplete: (file, url) => {
          console.log('Upload complete:', file.name, url.substring(0, 50) + '...');
        },
        onUploadError: (file, error) => {
          console.error('Upload failed:', file.name, error.message);
        },
        onFileDelete: (src, name, mimeType) => {
          // Called when a file is removed from the editor
          // Use this to delete the file from your server/CDN
          console.log('File deleted:', name, mimeType, src.substring(0, 30) + '...');
        },
      }),
    [],
  );

  // Shared mention click handler for edit and view modes
  const handleMentionClick = (item: { id: string; label: string }) => {
    console.log('Clicked mention:', item.label);
    alert(`Clicked on @${item.label}`);
  };

  // Create mention plugin with user search
  const mentionPlugin = useMemo(
    () =>
      createMentionPlugin({
        onSearch: async (query) => {
          // Simulate API delay
          await new Promise((r) => setTimeout(r, 100));
          return sampleUsers.filter((u) =>
            u.label.toLowerCase().includes(query.toLowerCase())
          );
        },
        onMentionSelect: (item) => {
          console.log('Mentioned:', item.label);
        },
        onMentionClick: handleMentionClick,
      }),
    []
  );

  const toggleTheme = () => {
    setIsDark((prev) => !prev)
    document.documentElement.classList.toggle('dark')
  }

  const features = [
    {
      icon: Type,
      title: 'Rich Formatting',
      description: 'Bold, italic, underline, strikethrough, code, and more',
    },
    {
      icon: Terminal,
      title: 'Slash Commands',
      description: 'Type "/" to access all block types instantly',
    },
    {
      icon: Blocks,
      title: 'Block Types',
      description: 'Headings, lists, quotes, code blocks, images, dividers',
    },
    {
      icon: Zap,
      title: 'Keyboard Shortcuts',
      description: 'Cmd+B, Cmd+I, Cmd+U, and many more',
    },
    {
      icon: Paperclip,
      title: 'File Attachments',
      description: 'Inline or card view, full-screen preview, drag & drop support',
    },
    {
      icon: AtSign,
      title: 'Mentions',
      description: 'Type "@" to mention users with async search',
    },
    {
      icon: Sparkles,
      title: 'Plugin System',
      description: 'Extend with custom blocks, commands, and toolbars',
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'TypeScript, full API access, controlled & uncontrolled modes',
    },
  ];

  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* Header */}
      <header className='border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-50'>
        <div className='container mx-auto px-4 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-primary flex items-center justify-center'>
              <Pencil className='w-4 h-4 text-primary-foreground' />
            </div>
            <span className='font-semibold text-lg'>Rich Text Editor</span>
          </div>

          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='icon' onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className='container mx-auto px-4 py-16 text-center'>
        <h1 className='text-4xl sm:text-5xl font-bold mb-4'>Rich Text Editor</h1>
        <p className='text-lg text-muted-foreground max-w-2xl mx-auto mb-8'>
          A beautiful, extensible editor component for React. Built with Tiptap, styled with shadcn/ui, and designed for
          developers.
        </p>
        <div className='flex gap-4 justify-center'>
          <Button size='lg'>
            <Code className='mr-2 h-4 w-4' />
            View Source
          </Button>
          <Button variant='outline' size='lg'>
            Documentation
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className='container mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12'>
          {features.map((feature) => (
            <Card key={feature.title} className='p-6'>
              <div className='w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4'>
                <feature.icon className='w-5 h-5 text-primary' />
              </div>
              <h3 className='font-semibold mb-2'>{feature.title}</h3>
              <p className='text-sm text-muted-foreground'>{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Editor Demo */}
      <section className='container mx-auto px-4 pb-16'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-2xl font-bold'>Try it out</h2>
          <div className='flex items-center gap-2'>
            <Button variant={mode === 'edit' ? 'default' : 'outline'} size='sm' onClick={() => setMode('edit')}>
              <Pencil className='mr-1.5 h-3.5 w-3.5' />
              Edit
            </Button>
            <Button variant={mode === 'view' ? 'default' : 'outline'} size='sm' onClick={() => setMode('view')}>
              <Eye className='mr-1.5 h-3.5 w-3.5' />
              View
            </Button>
          </div>
        </div>

        {mode === 'edit' ? (
          <RichTextEditor
            ref={editorRef}
            content={content.html}
            onChange={setContent}
            placeholder="Type '/' for commands..."
            minHeight='400px'
            codeBlockMaxHeight={500}
            className='border-0'
            plugins={[fileUploadPlugin, mentionPlugin]}
          />
        ) : (
          <Card className='overflow-hidden'>
            <RichTextViewer
              content={content.html ?? ''}
              className='border-0 min-h-[400px]'
              codeBlockMaxHeight={500}
              onMentionClick={handleMentionClick}
            />
          </Card>
        )}

        <p className='text-sm text-muted-foreground mt-4 text-center'>
          Tip: Type "@" to mention users, "/file" for attachments, or "/filecard" for card view. Click mentions or files
          to interact.
        </p>
      </section>

      {/* Usage Example */}
      <section className='container mx-auto px-4 pb-16'>
        <h2 className='text-2xl font-bold mb-4'>Quick Start</h2>
        <Card className='p-6 overflow-x-auto'>
          <pre className='text-sm'>
            <code>{`import { RichTextEditor, createFileUploadPlugin } from '@/components/ui/editor'

// Create file upload plugin with customizations
const fileUploadPlugin = createFileUploadPlugin({
  onUpload: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    return (await res.json()).url
  },
  accept: ['image/*', 'application/pdf', '.csv', '.json'],
  maxSize: 10 * 1024 * 1024,

  // Display mode by file type
  displayModeByType: {
    'image/*': 'block',      // Images show as block
    'application/pdf': 'block',
    'text/*': 'inline',      // Text files show inline
  },

  // Preview customizations
  previewOptions: {
    csv: {
      showRowNumbers: true,  // Show row numbers
      maxRows: 1000,         // Limit for performance
      delimiter: 'auto',     // Auto-detect delimiter
      alternateRowColors: true,
      highlightColumns: ['Status', 'Priority'], // Highlight specific columns
    },
    text: {
      showLineNumbers: true,
      fontSize: 13,
      wordWrap: true,
    },
    image: {
      allowZoom: true,
      showMetadata: true,
      transparentBackground: 'checkerboard',
    },
  },

  // Custom file fetcher for authenticated content
  onFetchFile: async (src, mimeType) => {
    const res = await fetch(src, { headers: { Authorization: 'Bearer token' }})
    return res.text()
  },

  // Cleanup when files are deleted
  onFileDelete: async (src, name, mimeType) => {
    await fetch('/api/files/delete', {
      method: 'DELETE',
      body: JSON.stringify({ url: src }),
    })
  },
})

function MyPage() {
  const [content, setContent] = useState('')

  return (
    <RichTextEditor
      content={content}
      onChange={(c) => setContent(c.html ?? '')}
      placeholder="Start writing..."
      plugins={[fileUploadPlugin]}
    />
  )
}

// Read-only mode
<RichTextEditor content={content} editable={false} />

// Or use the lightweight viewer
<RichTextViewer content={content} />`}</code>
          </pre>
        </Card>
      </section>

      {/* Footer */}
      <footer className='border-t border-border py-8'>
        <div className='container mx-auto px-4 text-center text-sm text-muted-foreground'>
          Built with Tiptap + React + shadcn/ui
        </div>
      </footer>
    </div>
  );
}
