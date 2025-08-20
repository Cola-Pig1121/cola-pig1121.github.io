import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tag, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  existingTags: string[]
  placeholder?: string
  className?: string
}

export function TagInput({ 
  tags, 
  onTagsChange, 
  existingTags, 
  placeholder = "输入标签名称",
  className 
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // 过滤建议标签
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = existingTags
        .filter(tag => 
          tag.toLowerCase().includes(inputValue.toLowerCase()) && 
          !tags.includes(tag)
        )
        .slice(0, 5) // 最多显示5个建议
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      setSelectedSuggestionIndex(-1)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [inputValue, existingTags, tags])

  // 添加标签
  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      onTagsChange([...tags, tag.trim()])
      setInputValue('')
      setShowSuggestions(false)
    }
  }

  // 移除标签
  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index))
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        addTag(suggestions[selectedSuggestionIndex])
      } else if (inputValue.trim()) {
        addTag(inputValue.trim())
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  // 点击建议项
  const handleSuggestionClick = (tag: string) => {
    addTag(tag)
  }

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium flex items-center gap-1">
        <Tag className="w-4 h-4" />
        标签 (可选)
      </Label>
      
      {/* 已添加的标签 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTag(index)}
                className="ml-1 p-0 h-auto w-auto hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* 输入框和建议 */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (inputValue.trim() && !tags.includes(inputValue.trim())) {
                addTag(inputValue.trim())
              }
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* 建议列表 */}
        {showSuggestions && suggestions.length > 0 && (
          <Card 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto"
          >
            <div className="p-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer rounded-sm transition-colors',
                    index === selectedSuggestionIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <p className="text-xs text-gray-500">
        输入标签名称，按回车键或点击加号添加。输入时会显示相关的现有标签供选择。
      </p>
    </div>
  )
}