import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LazyVideo } from '@/components/ui/lazy-video'
import { Play, Maximize } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useLazyLoad } from '@/hooks/use-lazy-load'

interface VideoFile {
  name: string
  displayName: string
  url: string
  date: string
  tags: string[]
  size?: number
  path: string
  thumbnail?: string
}

interface LazyVideoCardProps {
  video: VideoFile
  onPreview: () => void
  viewMode: 'grid' | 'list'
  onPlay?: (videoUrl: string) => void
  isPlaying?: boolean
}

export function LazyVideoCard({ video, onPreview, viewMode, onPlay, isPlaying }: LazyVideoCardProps) {
  const { elementRef, isVisible } = useLazyLoad({ rootMargin: '100px' })
  const [videoLoaded, setVideoLoaded] = useState(false)

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
              <div className="w-full aspect-video bg-gray-200 rounded-t-lg animate-pulse" />
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ) : (
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="p-0 relative">
              <div className="relative">
                <LazyVideo
                  src={video.url}
                  thumbnail={video.thumbnail}
                  alt={video.displayName}
                  className="rounded-t-lg group-hover:scale-105 transition-transform duration-200"
                  aspectRatio="video"
                  onLoad={() => setVideoLoaded(true)}
                  onPlay={() => onPlay?.(video.url)}
                  isPlaying={isPlaying}
                />
                {!videoLoaded && (
                  <div className="absolute inset-0 bg-gray-200 rounded-t-lg animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {/* 播放按钮 */}
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
                {video.displayName}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(video.date)}
              </p>
              {video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {video.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {video.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{video.tags.length - 2}
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
              <div className="w-20 h-12 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="group cursor-pointer hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <LazyVideo
                  src={video.url}
                  thumbnail={video.thumbnail}
                  alt={video.displayName}
                  className="w-20 h-12 rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                  aspectRatio="aspect-video"
                  onLoad={() => setVideoLoaded(true)}
                  onPlay={() => onPlay?.(video.url)}
                  isPlaying={isPlaying}
                />
                {!videoLoaded && (
                  <div className="absolute inset-0 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
                  </div>
                )}
                {/* 播放按钮 */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview()
                  }}
                >
                  <Play className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{video.displayName}</h3>
                <p className="text-sm text-gray-500">{formatDate(video.date)}</p>
                {video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {video.tags.map(tag => (
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