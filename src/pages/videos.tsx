import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { LazyVideoCard } from '@/components/ui/lazy-video-card'
import { TagInput } from '@/components/ui/tag-input'
import { Checkbox } from '@/components/ui/checkbox'
import { RefreshCw, Video as VideoIcon, Search, Grid, List, ChevronLeft, ChevronRight, Download, Calendar, CheckSquare, Square, Tag, Archive } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { getVideos, getAllTags, addTagsToFiles, getDownloadUrl } from '@/services/github'
import { generateThumbnailFromUrl } from '@/utils/video-thumbnail'
import { Link } from 'react-router-dom'

interface VideoFile {
  name: string
  displayName: string
  url: string
  date: string
  tags: string[]
  duration?: string
  size?: number
  path: string
}

interface VideoWithThumbnail extends VideoFile {
  thumbnail?: string
  thumbnailLoading?: boolean
  thumbnailError?: boolean
}

interface GroupedVideos {
  [date: string]: VideoWithThumbnail[]
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoWithThumbnail[]>([])
  const [filteredVideos, setFilteredVideos] = useState<VideoWithThumbnail[]>([])
  const [groupedVideos, setGroupedVideos] = useState<GroupedVideos>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(-1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  
  // 多选功能状态
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [newTags, setNewTags] = useState<string[]>([])
  const [isAddingTags, setIsAddingTags] = useState(false)

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isDialogOpen) return
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        const newIndex = selectedVideoIndex > 0 ? selectedVideoIndex - 1 : filteredVideos.length - 1
        setSelectedVideoIndex(newIndex)
        setPlayingVideo(null) // 停止当前视频播放
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        const newIndex = selectedVideoIndex < filteredVideos.length - 1 ? selectedVideoIndex + 1 : 0
        setSelectedVideoIndex(newIndex)
        setPlayingVideo(null) // 停止当前视频播放
      } else if (event.key === 'Escape') {
        setIsDialogOpen(false)
        setSelectedVideoIndex(-1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDialogOpen, selectedVideoIndex, filteredVideos.length])

  const openVideoDialog = (index: number) => {
    setSelectedVideoIndex(index)
    setIsDialogOpen(true)
  }

  const handlePlayVideo = (videoUrl: string) => {
    setPlayingVideo(playingVideo === videoUrl ? null : videoUrl)
  }

  // 多选功能函数
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    setSelectedVideos(new Set())
  }

  const toggleVideoSelection = (videoPath: string) => {
    const newSelected = new Set(selectedVideos)
    if (newSelected.has(videoPath)) {
      newSelected.delete(videoPath)
    } else {
      newSelected.add(videoPath)
    }
    setSelectedVideos(newSelected)
  }

  const selectAllVideos = () => {
    const allVideoPaths = new Set(filteredVideos.map(video => video.path))
    setSelectedVideos(allVideoPaths)
  }

  const clearSelection = () => {
    setSelectedVideos(new Set())
  }

  const downloadSelectedVideos = async () => {
    const selectedVideosList = filteredVideos.filter(video => selectedVideos.has(video.path))
    
    for (const video of selectedVideosList) {
      try {
        // 使用 getDownloadUrl 函数获取下载链接
        const downloadUrl = getDownloadUrl(video.url)
        const response = await fetch(downloadUrl)
        const blob = await response.blob()
        
        // 创建 blob URL
        const blobUrl = window.URL.createObjectURL(blob)
        
        // 创建下载链接
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = video.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理 blob URL
        window.URL.revokeObjectURL(blobUrl)
        
        // 添加延迟避免浏览器阻止多个下载
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`下载视频 ${video.name} 失败:`, error)
        // 如果 fetch 失败，回退到直接链接方式
        window.open(video.url, '_blank')
      }
    }
    
    setSelectedVideos(new Set())
    setIsMultiSelectMode(false)
  }

  const openTagDialog = () => {
    setNewTags([])
    setIsTagDialogOpen(true)
  }

  const addTagsToSelectedVideos = async () => {
    if (newTags.length === 0 || selectedVideos.size === 0) return

    setIsAddingTags(true)
    try {
      const selectedVideosList = filteredVideos.filter(video => selectedVideos.has(video.path))
      await addTagsToFiles(selectedVideosList.map(video => video.path), newTags, 'video')
      
      // 重新获取数据
      await fetchVideos()
      
      // 清空选择和关闭对话框
      setSelectedVideos(new Set())
      setIsTagDialogOpen(false)
      setNewTags([])
      setIsMultiSelectMode(false)
    } catch (error) {
      console.error('添加标签失败:', error)
    } finally {
      setIsAddingTags(false)
    }
  }

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

      // 获取所有现有标签
      const tags = await getAllTags()
      setAllTags(tags)

      // 先设置初始状态
      const videosWithInitialState = videoFiles.map(video => ({
        ...video,
        thumbnail: undefined,
        thumbnailLoading: true,
        thumbnailError: false
      }))
      setVideos(videosWithInitialState)
      setFilteredVideos(videosWithInitialState)

      // 按日期分组
      const grouped = videosWithInitialState.reduce((acc, video) => {
        if (!acc[video.date]) {
          acc[video.date] = []
        }
        acc[video.date].push(video)
        return acc
      }, {} as GroupedVideos)
      setGroupedVideos(grouped)

      // 异步生成缩略图
      const videosWithThumbnails = await Promise.all(
        videoFiles.map(generateThumbnail)
      )
      setVideos(videosWithThumbnails)
      setFilteredVideos(videosWithThumbnails)

      // 重新分组带缩略图的视频
      const groupedWithThumbnails = videosWithThumbnails.reduce((acc, video) => {
        if (!acc[video.date]) {
          acc[video.date] = []
        }
        acc[video.date].push(video)
        return acc
      }, {} as GroupedVideos)
      setGroupedVideos(groupedWithThumbnails)
    } catch (error) {
      console.error('获取视频失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 过滤视频
  useEffect(() => {
    let filtered = videos

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 按标签过滤
    if (selectedTag !== 'all') {
      filtered = filtered.filter(video => video.tags.includes(selectedTag))
    }

    setFilteredVideos(filtered)

    // 重新分组过滤后的视频
    const grouped = filtered.reduce((acc, video) => {
      if (!acc[video.date]) {
        acc[video.date] = []
      }
      acc[video.date].push(video)
      return acc
    }, {} as GroupedVideos)

    setGroupedVideos(grouped)
  }, [videos, searchTerm, selectedTag])

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
            <p className="text-sm sm:text-base text-gray-600">
              共 {videos.length} 个视频 {filteredVideos.length !== videos.length && `(显示 ${filteredVideos.length} 个)`}
              {isMultiSelectMode && selectedVideos.size > 0 && ` (已选择 ${selectedVideos.size} 个)`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={toggleMultiSelectMode} 
            variant={isMultiSelectMode ? "default" : "outline"}
            className="self-start sm:self-auto"
          >
            {isMultiSelectMode ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
            {isMultiSelectMode ? '退出多选' : '多选模式'}
          </Button>
          <Button onClick={fetchVideos} variant="outline" className="self-start sm:self-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 多选操作栏 */}
      {isMultiSelectMode && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Button onClick={selectAllVideos} variant="outline" size="sm">
                  全选 ({filteredVideos.length})
                </Button>
                <Button onClick={clearSelection} variant="outline" size="sm" disabled={selectedVideos.size === 0}>
                  清空选择
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={openTagDialog} 
                  variant="outline" 
                  size="sm" 
                  disabled={selectedVideos.size === 0}
                >
                  <Tag className="w-4 h-4 mr-1" />
                  添加标签 ({selectedVideos.size})
                </Button>
                <Button 
                  onClick={downloadSelectedVideos} 
                  variant="outline" 
                  size="sm" 
                  disabled={selectedVideos.size === 0}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  批量下载 ({selectedVideos.size})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 添加标签对话框 */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">为选中的视频添加标签</h3>
              <p className="text-sm text-gray-500">已选择 {selectedVideos.size} 个视频</p>
            </div>
            <TagInput
              tags={newTags}
              onTagsChange={setNewTags}
              existingTags={allTags}
              placeholder="输入要添加的标签"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={addTagsToSelectedVideos} disabled={isAddingTags || newTags.length === 0}>
                {isAddingTags ? '添加中...' : '添加标签'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 搜索和过滤栏 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索视频名称或标签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="选择标签" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有标签</SelectItem>
            {allTags.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 全局弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDialogOpen(false)
          setSelectedVideoIndex(-1)
          setPlayingVideo(null)
        }
      }}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-[1200px] max-h-[800px] p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center p-4 bg-black relative" style={{ height: window.innerWidth <= 768 ? '612px' : '680px' }}>
              <video
                key={selectedVideoIndex}
                src={filteredVideos[selectedVideoIndex]?.url}
                controls
                className="max-w-full max-h-full object-contain"
              >
                您的浏览器不支持视频播放。
              </video>
              
              {/* 导航按钮 */}
              {filteredVideos.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={() => {
                      const newIndex = selectedVideoIndex > 0 ? selectedVideoIndex - 1 : filteredVideos.length - 1
                      setSelectedVideoIndex(newIndex)
                      setPlayingVideo(null) // 停止当前视频播放
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={() => {
                      const newIndex = selectedVideoIndex < filteredVideos.length - 1 ? selectedVideoIndex + 1 : 0
                      setSelectedVideoIndex(newIndex)
                      setPlayingVideo(null) // 停止当前视频播放
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{filteredVideos[selectedVideoIndex]?.displayName}</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    const currentVideo = filteredVideos[selectedVideoIndex]
                    if (!currentVideo) return
                    
                    try {
                      // 使用 getDownloadUrl 函数获取下载链接
                      const downloadUrl = getDownloadUrl(currentVideo.url)
                      const response = await fetch(downloadUrl)
                      const blob = await response.blob()
                      const blobUrl = window.URL.createObjectURL(blob)
                      
                      const link = document.createElement('a')
                      link.href = blobUrl
                      link.download = currentVideo.name
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      
                      window.URL.revokeObjectURL(blobUrl)
                    } catch (error) {
                      console.error('下载失败:', error)
                      window.open(currentVideo.url, '_blank')
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  下载
                </Button>
              </div>
              <p className="text-sm text-gray-500 text-center">{formatDate(filteredVideos[selectedVideoIndex]?.date || '')}</p>
              {filteredVideos[selectedVideoIndex]?.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {filteredVideos[selectedVideoIndex]?.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {filteredVideos.length > 1 && (
                <p className="text-xs text-gray-400 text-center">
                  {selectedVideoIndex + 1} / {filteredVideos.length} - 使用左右箭头键切换
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 视频分组展示 */}
      {Object.keys(groupedVideos).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <VideoIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无视频</h3>
            <p className="text-gray-500 text-center">
              还没有上传任何视频，<br />
              <Link to="/upload">
                <Button variant="link" className="p-0 h-auto">
                  点击这里上传第一个视频
                </Button>
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedVideos)
            .sort(([a], [b]) => b.localeCompare(a)) // 按日期倒序排列
            .map(([date, dateVideos]) => (
              <div key={date} className="space-y-4">
                {/* 日期标签 */}
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="flex items-center space-x-2 px-3 py-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(date)}</span>
                  </Badge>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm text-gray-500">{dateVideos.length} 个视频</span>
                </div>

                {/* 视频展示 */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {dateVideos.map((video, index) => {
                      const globalIndex = filteredVideos.findIndex(vid => vid.url === video.url)
                      const isSelected = selectedVideos.has(video.path)
                      return (
                        <div key={`${date}-${index}`} className="relative">
                          {isMultiSelectMode && (
                            <div className="absolute top-2 left-2 z-10">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleVideoSelection(video.path)}
                                className="bg-white border-2 border-gray-300 shadow-sm"
                              />
                            </div>
                          )}
                          <LazyVideoCard
                            video={video}
                            viewMode="grid"
                            onPreview={() => !isMultiSelectMode && openVideoDialog(globalIndex)}
                            onPlay={handlePlayVideo}
                            isPlaying={playingVideo === video.url}
                            onClick={() => isMultiSelectMode && toggleVideoSelection(video.path)}
                            className={isMultiSelectMode ? 'cursor-pointer' : ''}
                            style={isSelected ? { outline: '2px solid #3b82f6' } : {}}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dateVideos.map((video, index) => {
                      const globalIndex = filteredVideos.findIndex(vid => vid.url === video.url)
                      const isSelected = selectedVideos.has(video.path)
                      return (
                        <div key={`${date}-${index}`} className="relative">
                          {isMultiSelectMode && (
                            <div className="absolute top-2 left-2 z-10">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleVideoSelection(video.path)}
                                className="bg-white border-2 border-gray-300 shadow-sm"
                              />
                            </div>
                          )}
                          <LazyVideoCard
                            video={video}
                            viewMode="list"
                            onPreview={() => !isMultiSelectMode && openVideoDialog(globalIndex)}
                            onPlay={handlePlayVideo}
                            isPlaying={playingVideo === video.url}
                            onClick={() => isMultiSelectMode && toggleVideoSelection(video.path)}
                            className={isMultiSelectMode ? 'cursor-pointer' : ''}
                            style={isSelected ? { outline: '2px solid #3b82f6' } : {}}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}