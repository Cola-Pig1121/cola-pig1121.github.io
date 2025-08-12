import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Video as VideoIcon, Play, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { getVideos } from '@/services/github'
import { generateThumbnailFromUrl } from '@/utils/video-thumbnail'

interface VideoFile {
  name: string
  url: string
  date: string
  duration?: string
  size?: number
}

interface VideoWithThumbnail extends VideoFile {
  thumbnail?: string
  thumbnailLoading?: boolean
  thumbnailError?: boolean
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoWithThumbnail[]>([])
  const [loading, setLoading] = useState(true)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

  // 生成视频缩略图
  const generateThumbnail = async (video: VideoFile): Promise<VideoWithThumbnail> => {
    try {
      const thumbnail = await generateThumbnailFromUrl(video.url, 1)
      return {
        ...video,
        thumbnail,
        thumbnailLoading: false,
        thumbnailError: false
      }
    } catch (error) {
      console.error('生成缩略图失败:', error)
      return {
        ...video,
        thumbnail: undefined,
        thumbnailLoading: false,
        thumbnailError: true
      }
    }
  }

  // 从GitHub API获取视频数据
  const fetchVideos = async () => {
    setLoading(true)
    try {
      const videoFiles = await getVideos()
      
      // 先设置初始状态
      const videosWithInitialState = videoFiles.map(video => ({
        ...video,
        thumbnail: undefined,
        thumbnailLoading: true,
        thumbnailError: false
      }))
      setVideos(videosWithInitialState)
      
      // 异步生成缩略图
      const videosWithThumbnails = await Promise.all(
        videoFiles.map(generateThumbnail)
      )
      setVideos(videosWithThumbnails)
    } catch (error) {
      console.error('获取视频失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'yyyy年MM月dd日', { locale: zhCN })
    } catch {
      return dateString
    }
  }

  const handlePlayVideo = (videoUrl: string) => {
    setPlayingVideo(playingVideo === videoUrl ? null : videoUrl)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>加载视频中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <VideoIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">视频管理</h1>
            <p className="text-sm sm:text-base text-gray-600">共 {videos.length} 个视频</p>
          </div>
        </div>
        <Button onClick={fetchVideos} variant="outline" className="self-start sm:self-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 视频列表展示 */}
      {videos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <VideoIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无视频</h3>
            <p className="text-gray-500 text-center">
              还没有上传任何视频，<br />
              <Button variant="link" className="p-0 h-auto">
                点击这里上传第一个视频
              </Button>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {videos
            .sort((a, b) => b.date.localeCompare(a.date)) // 按日期倒序排列
            .map((video, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* 视频缩略图/播放器 */}
                  <div className="w-full md:w-1/3 relative">
                    {playingVideo === video.url ? (
                      <div className="aspect-video">
                        <video
                          controls
                          autoPlay
                          className="w-full h-full object-cover"
                          onEnded={() => setPlayingVideo(null)}
                        >
                          <source src={video.url} type="video/mp4" />
                          您的浏览器不支持视频播放。
                        </video>
                      </div>
                    ) : (
                      <div 
                        className="aspect-video bg-gray-100 flex items-center justify-center cursor-pointer group relative overflow-hidden"
                        onClick={() => handlePlayVideo(video.url)}
                      >
                        {video.thumbnailLoading ? (
                          <div className="flex flex-col items-center space-y-2">
                            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                            <span className="text-sm text-gray-500">生成缩略图中...</span>
                          </div>
                        ) : video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="flex flex-col items-center space-y-2">
                            <VideoIcon className="w-16 h-16 text-gray-400" />
                            {video.thumbnailError && (
                              <span className="text-xs text-red-500">缩略图生成失败</span>
                            )}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                          <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-gray-800 ml-1" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 视频信息 */}
                  <div className="md:w-2/3 p-6">
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl font-semibold text-gray-900 leading-tight">
                          {video.name.replace('.mp4', '')}
                        </CardTitle>
                        <Badge variant="secondary" className="ml-4 flex-shrink-0">
                          {formatDate(video.date)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 space-y-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {video.duration && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{video.duration}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <VideoIcon className="w-4 h-4" />
                          <span>MP4</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <Button
                          onClick={() => handlePlayVideo(video.url)}
                          className="flex items-center space-x-2 w-full sm:w-auto"
                        >
                          <Play className="w-4 h-4" />
                          <span>{playingVideo === video.url ? '停止播放' : '播放视频'}</span>
                        </Button>
                        
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                          <a href={video.url} download={video.name}>
                            下载
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}