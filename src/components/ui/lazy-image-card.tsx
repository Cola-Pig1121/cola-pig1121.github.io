import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LazyImage } from '@/components/ui/lazy-image'
import { Maximize } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useLazyLoad } from '@/hooks/use-lazy-load'

interface ImageFile {
  name: string
  displayName: string
  url: string
  date: string
  tags: string[]
  size?: number
  path: string
}

interface LazyImageCardProps {
  image: ImageFile
  onPreview: () => void
  viewMode: 'grid' | 'list'
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

export function LazyImageCard({ image, onPreview, viewMode, onClick, className, style }: LazyImageCardProps) {
  const { elementRef, isVisible } = useLazyLoad({ rootMargin: '100px' })

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'yyyy年MM月dd日', { locale: zhCN })
    } catch {
      return dateString
    }
  }

  if (viewMode === 'grid') {
    return (
      <div ref={elementRef} className="w-full">
        {!isVisible ? (
          // 骨架屏
          <Card className="group cursor-pointer">
            <CardHeader className="p-0 relative">
              <div className="w-full aspect-square bg-gray-200 rounded-t-lg animate-pulse" />
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ) : (
          <Card 
            className={`group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${className || ''}`}
            style={style}
            onClick={onClick}
          >
            <CardHeader className="p-0 relative">
              <div className="relative">
                <LazyImage
                  src={image.url}
                  alt={image.displayName}
                  className="rounded-t-lg group-hover:scale-105 transition-transform duration-200"
                  aspectRatio="square"
                />
              </div>
              {/* 预览按钮 */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview()
                }}
              >
                <Maximize className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-3">
              <CardTitle className="text-sm font-medium truncate">
                {image.displayName}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(image.date)}
              </p>
              {image.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {image.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {image.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{image.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // 列表模式
  return (
    <div ref={elementRef} className="w-full">
      {!isVisible ? (
        // 骨架屏
        <Card className="group cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card 
          className={`group cursor-pointer hover:shadow-md transition-all duration-200 ${className || ''}`}
          style={style}
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <LazyImage
                  src={image.url}
                  alt={image.displayName}
                  className="w-16 h-16 rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                  aspectRatio="aspect-square"
                />
                {/* 预览按钮 */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview()
                  }}
                >
                  <Maximize className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{image.displayName}</h3>
                <p className="text-sm text-gray-500">{formatDate(image.date)}</p>
                {image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {image.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}