import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle, DialogDescription, VisuallyHidden } from '@/components/ui/dialog'
import { LazyImageCard } from '@/components/ui/lazy-image-card'
import { TagInput } from '@/components/ui/tag-input'
import { Checkbox } from '@/components/ui/checkbox'
import { RefreshCw, Image as ImageIcon, Search, Grid, List, ChevronLeft, ChevronRight, Download, Calendar, CheckSquare, Square, Tag, Archive } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { getImages, getAllTags, addTagsToFiles, getDownloadUrl } from '@/services/github'
import { Link } from 'react-router-dom'

interface ImageFile {
  name: string
  displayName: string
  url: string
  date: string
  tags: string[]
  size?: number
  path: string
}

interface GroupedImages {
  [date: string]: ImageFile[]
}

export default function ImagesPage() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [filteredImages, setFilteredImages] = useState<ImageFile[]>([])
  const [groupedImages, setGroupedImages] = useState<GroupedImages>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // 多选功能状态
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [newTags, setNewTags] = useState<string[]>([])
  const [isAddingTags, setIsAddingTags] = useState(false)

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isDialogOpen) return
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : filteredImages.length - 1
        setSelectedImageIndex(newIndex)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        const newIndex = selectedImageIndex < filteredImages.length - 1 ? selectedImageIndex + 1 : 0
        setSelectedImageIndex(newIndex)
      } else if (event.key === 'Escape') {
        setIsDialogOpen(false)
        setSelectedImageIndex(-1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDialogOpen, selectedImageIndex, filteredImages.length])

  const openImageDialog = (index: number) => {
    setSelectedImageIndex(index)
    setIsDialogOpen(true)
  }

  // 多选功能函数
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    setSelectedImages(new Set())
  }

  const toggleImageSelection = (imagePath: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(imagePath)) {
      newSelected.delete(imagePath)
    } else {
      newSelected.add(imagePath)
    }
    setSelectedImages(newSelected)
  }

  const selectAllImages = () => {
    const allImagePaths = new Set(filteredImages.map(img => img.path))
    setSelectedImages(allImagePaths)
  }

  const clearSelection = () => {
    setSelectedImages(new Set())
  }

  const downloadSelectedImages = async () => {
    const selectedImagesList = filteredImages.filter(img => selectedImages.has(img.path))
    
    for (const image of selectedImagesList) {
      try {
        // 使用 getDownloadUrl 函数获取下载链接
        const downloadUrl = getDownloadUrl(image.url)
        const response = await fetch(downloadUrl)
        const blob = await response.blob()
        
        // 创建 blob URL
        const blobUrl = window.URL.createObjectURL(blob)
        
        // 创建下载链接
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = image.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理 blob URL
        window.URL.revokeObjectURL(blobUrl)
        
        // 添加延迟避免浏览器阻止多个下载
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`下载图片 ${image.name} 失败:`, error)
        // 如果 fetch 失败，回退到直接链接方式
        window.open(image.url, '_blank')
      }
    }
    
    setSelectedImages(new Set())
    setIsMultiSelectMode(false)
  }

  const openTagDialog = () => {
    setNewTags([])
    setIsTagDialogOpen(true)
  }

  const addTagsToSelectedImages = async () => {
    if (newTags.length === 0 || selectedImages.size === 0) return

    setIsAddingTags(true)
    try {
      const selectedImagesList = filteredImages.filter(img => selectedImages.has(img.path))
      await addTagsToFiles(selectedImagesList.map(img => img.path), newTags, 'image')
      
      // 重新获取数据
      await fetchImages()
      
      // 清空选择和关闭对话框
      setSelectedImages(new Set())
      setIsTagDialogOpen(false)
      setNewTags([])
      setIsMultiSelectMode(false)
    } catch (error) {
      console.error('添加标签失败:', error)
    } finally {
      setIsAddingTags(false)
    }
  }

  // 从GitHub API获取图片数据
  const fetchImages = async () => {
    setLoading(true)
    try {
      const imageFiles = await getImages()
      setImages(imageFiles)
      setFilteredImages(imageFiles)

      // 获取所有现有标签
      const tags = await getAllTags()
      setAllTags(tags)

      // 按日期分组
      const grouped = imageFiles.reduce((acc, image) => {
        if (!acc[image.date]) {
          acc[image.date] = []
        }
        acc[image.date].push(image)
        return acc
      }, {} as GroupedImages)

      setGroupedImages(grouped)
    } catch (error) {
      console.error('获取图片失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 过滤图片
  useEffect(() => {
    let filtered = images

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(image =>
        image.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 按标签过滤
    if (selectedTag !== 'all') {
      filtered = filtered.filter(image => image.tags.includes(selectedTag))
    }

    setFilteredImages(filtered)

    // 重新分组过滤后的图片
    const grouped = filtered.reduce((acc, image) => {
      if (!acc[image.date]) {
        acc[image.date] = []
      }
      acc[image.date].push(image)
      return acc
    }, {} as GroupedImages)

    setGroupedImages(grouped)
  }, [images, searchTerm, selectedTag])

  useEffect(() => {
    fetchImages()
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
          <span>加载图片中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">图片管理</h1>
            <p className="text-sm sm:text-base text-gray-600">
              共 {images.length} 张图片 {filteredImages.length !== images.length && `(显示 ${filteredImages.length} 张)`}
              {isMultiSelectMode && selectedImages.size > 0 && ` (已选择 ${selectedImages.size} 张)`}
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
          <Button onClick={fetchImages} variant="outline" className="self-start sm:self-auto">
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
                <Button onClick={selectAllImages} variant="outline" size="sm">
                  全选 ({filteredImages.length})
                </Button>
                <Button onClick={clearSelection} variant="outline" size="sm" disabled={selectedImages.size === 0}>
                  清空选择
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={openTagDialog} 
                  variant="outline" 
                  size="sm" 
                  disabled={selectedImages.size === 0}
                >
                  <Tag className="w-4 h-4 mr-1" />
                  添加标签 ({selectedImages.size})
                </Button>
                <Button 
                  onClick={downloadSelectedImages} 
                  variant="outline" 
                  size="sm" 
                  disabled={selectedImages.size === 0}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  批量下载 ({selectedImages.size})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 添加标签对话框 */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <VisuallyHidden>
            <DialogTitle>添加标签</DialogTitle>
            <DialogDescription>为选中的图片添加标签</DialogDescription>
          </VisuallyHidden>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">为选中的图片添加标签</h3>
              <p className="text-sm text-gray-500">已选择 {selectedImages.size} 张图片</p>
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
              <Button onClick={addTagsToSelectedImages} disabled={isAddingTags || newTags.length === 0}>
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
            placeholder="搜索图片名称或标签..."
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
          setSelectedImageIndex(-1)
        }
      }}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-[1200px] max-h-[800px] p-0">
          <VisuallyHidden>
            <DialogTitle>图片预览</DialogTitle>
            <DialogDescription>查看图片详情</DialogDescription>
          </VisuallyHidden>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center p-4 bg-black relative" style={{ height: window.innerWidth <= 768 ? '612px' : '680px' }}>
              <img
                src={filteredImages[selectedImageIndex]?.url}
                alt={filteredImages[selectedImageIndex]?.displayName}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* 导航按钮 */}
              {filteredImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={() => {
                      const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : filteredImages.length - 1
                      setSelectedImageIndex(newIndex)
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={() => {
                      const newIndex = selectedImageIndex < filteredImages.length - 1 ? selectedImageIndex + 1 : 0
                      setSelectedImageIndex(newIndex)
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{filteredImages[selectedImageIndex]?.displayName}</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    const currentImage = filteredImages[selectedImageIndex]
                    if (!currentImage) return
                    
                    try {
                      // 转换下载链接为更快的 CDN
                      const downloadUrl = currentImage.url.replace('raw.githubusercontent.com', 'raw.staticdn.net')
                      const response = await fetch(downloadUrl)
                      const blob = await response.blob()
                      const blobUrl = window.URL.createObjectURL(blob)
                      
                      const link = document.createElement('a')
                      link.href = blobUrl
                      link.download = currentImage.name
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      
                      window.URL.revokeObjectURL(blobUrl)
                    } catch (error) {
                      console.error('下载失败:', error)
                      window.open(currentImage.url, '_blank')
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  下载
                </Button>
              </div>
              <p className="text-sm text-gray-500 text-center">{formatDate(filteredImages[selectedImageIndex]?.date || '')}</p>
              {filteredImages[selectedImageIndex]?.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {filteredImages[selectedImageIndex]?.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {filteredImages.length > 1 && (
                <p className="text-xs text-gray-400 text-center">
                  {selectedImageIndex + 1} / {filteredImages.length} - 使用左右箭头键切换
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 图片分组展示 */}
      {Object.keys(groupedImages).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
            <p className="text-gray-500 text-center">
              还没有上传任何图片，<br />
              <Link to="/upload">
                <Button variant="link" className="p-0 h-auto">
                  点击这里上传第一张图片
                </Button>
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedImages)
            .sort(([a], [b]) => b.localeCompare(a)) // 按日期倒序排列
            .map(([date, dateImages]) => (
              <div key={date} className="space-y-4">
                {/* 日期标签 */}
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="flex items-center space-x-2 px-3 py-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(date)}</span>
                  </Badge>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm text-gray-500">{dateImages.length} 张图片</span>
                </div>

                {/* 图片展示 */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                    {dateImages.map((image, index) => {
                      const globalIndex = filteredImages.findIndex(img => img.url === image.url)
                      const isSelected = selectedImages.has(image.path)
                      return (
                        <div key={`${date}-${index}`} className="relative">
                          {isMultiSelectMode && (
                            <div className="absolute top-2 left-2 z-10">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleImageSelection(image.path)}
                                className="bg-white border-2 border-gray-300 shadow-sm"
                              />
                            </div>
                          )}
                          <LazyImageCard
                            image={image}
                            viewMode="grid"
                            onPreview={() => !isMultiSelectMode && openImageDialog(globalIndex)}
                            onClick={() => isMultiSelectMode && toggleImageSelection(image.path)}
                            className={isMultiSelectMode ? 'cursor-pointer' : ''}
                            style={isSelected ? { outline: '2px solid #3b82f6' } : {}}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dateImages.map((image, index) => {
                      const globalIndex = filteredImages.findIndex(img => img.url === image.url)
                      const isSelected = selectedImages.has(image.path)
                      return (
                        <div key={`${date}-${index}`} className="relative">
                          {isMultiSelectMode && (
                            <div className="absolute top-2 left-2 z-10">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleImageSelection(image.path)}
                                className="bg-white border-2 border-gray-300 shadow-sm"
                              />
                            </div>
                          )}
                          <LazyImageCard
                            image={image}
                            viewMode="list"
                            onPreview={() => !isMultiSelectMode && openImageDialog(globalIndex)}
                            onClick={() => isMultiSelectMode && toggleImageSelection(image.path)}
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