import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { Info, AlertTriangle, XCircle, CheckCircle, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { CalloutTypeConfig } from './types'

// Default callout types
const DEFAULT_CALLOUT_TYPES: CalloutTypeConfig[] = [
  {
    id: 'info',
    label: 'Info',
    icon: Info,
    bgLight: 'hsl(210 100% 97%)',
    borderLight: 'hsl(210 100% 85%)',
    iconColorLight: 'hsl(210 100% 50%)',
    bgDark: 'hsl(210 50% 15%)',
    borderDark: 'hsl(210 50% 30%)',
    iconColorDark: 'hsl(210 100% 70%)',
  },
  {
    id: 'warning',
    label: 'Warning',
    icon: AlertTriangle,
    bgLight: 'hsl(45 100% 96%)',
    borderLight: 'hsl(45 100% 75%)',
    iconColorLight: 'hsl(45 100% 40%)',
    bgDark: 'hsl(45 50% 15%)',
    borderDark: 'hsl(45 50% 30%)',
    iconColorDark: 'hsl(45 100% 60%)',
  },
  {
    id: 'error',
    label: 'Error',
    icon: XCircle,
    bgLight: 'hsl(0 100% 97%)',
    borderLight: 'hsl(0 70% 85%)',
    iconColorLight: 'hsl(0 70% 50%)',
    bgDark: 'hsl(0 50% 15%)',
    borderDark: 'hsl(0 50% 30%)',
    iconColorDark: 'hsl(0 70% 65%)',
  },
  {
    id: 'success',
    label: 'Success',
    icon: CheckCircle,
    bgLight: 'hsl(140 60% 96%)',
    borderLight: 'hsl(140 60% 80%)',
    iconColorLight: 'hsl(140 60% 40%)',
    bgDark: 'hsl(140 30% 15%)',
    borderDark: 'hsl(140 30% 30%)',
    iconColorDark: 'hsl(140 60% 60%)',
  },
]

export { DEFAULT_CALLOUT_TYPES }

export function CalloutComponent({ node, updateAttributes, editor, extension }: NodeViewProps) {
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get custom types from extension options, or use defaults
  const calloutTypes: CalloutTypeConfig[] = extension.options.calloutTypes || DEFAULT_CALLOUT_TYPES

  const calloutTypeId = (node.attrs.type || calloutTypes[0]?.id || 'info') as string
  const currentType = calloutTypes.find((t) => t.id === calloutTypeId) || calloutTypes[0]
  const Icon = currentType?.icon || Info
  const isEditable = editor.isEditable

  // Detect dark mode
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Compute inline styles for custom colors
  const wrapperStyle = useMemo(() => {
    if (!currentType) return {}
    return {
      backgroundColor: isDark ? currentType.bgDark : currentType.bgLight,
      borderColor: isDark ? currentType.borderDark : currentType.borderLight,
    }
  }, [currentType, isDark])

  const iconStyle = useMemo(() => {
    if (!currentType) return {}
    return {
      color: isDark ? currentType.iconColorDark : currentType.iconColorLight,
    }
  }, [currentType, isDark])

  const setType = (typeId: string) => {
    updateAttributes({ type: typeId })
    setShowTypeDropdown(false)
  }

  const handleToggleDropdown = useCallback(() => {
    if (!showTypeDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      })
    }
    setShowTypeDropdown(!showTypeDropdown)
  }, [showTypeDropdown])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showTypeDropdown) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const isInsideButton = buttonRef.current?.contains(target)
      const isInsideDropdown = dropdownRef.current?.contains(target)

      if (!isInsideButton && !isInsideDropdown) {
        setShowTypeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTypeDropdown])

  return (
    <NodeViewWrapper className="callout-wrapper" style={wrapperStyle} data-callout-type={calloutTypeId}>
      <div className="callout-icon-container" style={iconStyle} contentEditable={false}>
        {isEditable ? (
          <div className="callout-type-selector">
            <button ref={buttonRef} className="callout-type-button" onClick={handleToggleDropdown} type="button">
              <Icon size={20} />
              <ChevronDown size={12} className="callout-type-chevron" />
            </button>

            {showTypeDropdown && (
              <div
                ref={dropdownRef}
                className="callout-type-dropdown"
                style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
              >
                {calloutTypes.map((type) => {
                  const TypeIcon = type.icon
                  return (
                    <button
                      key={type.id}
                      className={cn('callout-type-option', type.id === calloutTypeId && 'callout-type-option-active')}
                      onClick={() => setType(type.id)}
                      type="button"
                    >
                      <TypeIcon size={16} />
                      <span>{type.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <Icon size={20} />
        )}
      </div>
      <div className="callout-content">
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  )
}
