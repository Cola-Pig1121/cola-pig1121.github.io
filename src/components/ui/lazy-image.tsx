import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: 'square' | 'video' | string
  placeholder?: React.ReactNode
  onLoad?: () => void
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  aspectRatio = 'square',
  placeholder,
  onLoad
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
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

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square'
      case 'video':
        return 'aspect-video'
      default:
        return aspectRatio
    }
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        getAspectRatioClass(),
        className
      )}
    >
      {/* 加载占位符 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder || (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">加载中...</span>
            </div>
          )}
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm">加载失败</span>
          </div>
        </div>
      )}

      {/* 实际图片 */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  )
}