import { useState, useRef, useEffect } from 'react'
import { Play, VideoIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getVideoDisplayUrl } from '@/services/github'

interface LazyVideoProps {
  src: string
  thumbnail?: string
  alt: string
  className?: string
  aspectRatio?: 'video' | 'aspect-video' | string
  onPlay?: () => void
  onLoad?: () => void
  isPlaying?: boolean
  placeholder?: React.ReactNode
}

export function LazyVideo({ 
  src, 
  thumbnail,
  alt, 
  className,
  aspectRatio = 'video',
  onPlay,
  onLoad,
  isPlaying = false,
  placeholder 
}: LazyVideoProps) {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true)
    onLoad?.()
  }

  const handleThumbnailError = () => {
    setThumbnailError(true)
    setThumbnailLoaded(true)
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'video':
      case 'aspect-video':
        return 'aspect-video'
      default:
        return aspectRatio
    }
  }

  if (isPlaying) {
    return (
      <div className={cn(getAspectRatioClass(), className)}>
        <video
          controls
          autoPlay
          className="w-full h-full object-cover"
          onEnded={() => onPlay?.()}
        >
          <source src={getVideoDisplayUrl(src)} type="video/mp4" />
          您的浏览器不支持视频播放。
        </video>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        getAspectRatioClass(),
        'bg-gray-100 flex items-center justify-center cursor-pointer group relative overflow-hidden',
        className
      )}
      onClick={onPlay}
    >
      {/* 加载状态 */}
      {!thumbnailLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder || (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">生成缩略图中...</span>
            </div>
          )}
        </div>
      )}

      {/* 缩略图或默认图标 */}
      {isInView && (
        <>
          {thumbnail && !thumbnailError ? (
            <img
              src={thumbnail}
              alt={alt}
              onLoad={handleThumbnailLoad}
              onError={handleThumbnailError}
              className={cn(
                'w-full h-full object-cover group-hover:scale-105 transition-all duration-300',
                thumbnailLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <VideoIcon className="w-16 h-16 text-gray-400" />
              {thumbnailError && (
                <span className="text-xs text-red-500">缩略图生成失败</span>
              )}
            </div>
          )}

          {/* 播放按钮覆盖层 */}
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
            <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-gray-800 ml-1" />
            </div>
          </div>
        </>
      )}

      {/* 未进入视口时的占位符 */}
      {!isInView && (
        <div className="flex flex-col items-center space-y-2">
          <VideoIcon className="w-16 h-16 text-gray-400" />
          <span className="text-sm text-gray-500">视频预览</span>
        </div>
      )}
    </div>
  )
}