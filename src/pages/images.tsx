import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { RefreshCw, Calendar, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { getImages } from '@/services/github'

interface ImageFile {
  name: string
  url: string
  date: string
  size?: number
}

interface GroupedImages {
  [date: string]: ImageFile[]
}

export default function ImagesPage() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [groupedImages, setGroupedImages] = useState<GroupedImages>({})
  const [loading, setLoading] = useState(true)

  // 从GitHub API获取图片数据
  const fetchImages = async () => {
    setLoading(true)
    try {
      const imageFiles = await getImages()
      setImages(imageFiles)
      
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
            <p className="text-sm sm:text-base text-gray-600">共 {images.length} 张图片</p>
          </div>
        </div>
        <Button onClick={fetchImages} variant="outline" className="self-start sm:self-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 图片分组展示 */}
      {Object.keys(groupedImages).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
            <p className="text-gray-500 text-center">
              还没有上传任何图片，<br />
              <Button variant="link" className="p-0 h-auto">
                点击这里上传第一张图片
              </Button>
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

                {/* 图片网格 */}
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                  {dateImages.map((image, index) => (
                    <Dialog key={`${date}-${index}`}>
                      <DialogTrigger asChild>
                        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                          <CardHeader className="p-0">
                            <div className="aspect-square overflow-hidden rounded-t-lg">
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="p-3">
                            <CardTitle className="text-sm font-medium truncate">
                              {image.name}
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(image.date)}
                            </p>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <div className="space-y-4">
                          <div className="aspect-video overflow-hidden rounded-lg">
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="text-center">
                            <h3 className="font-medium">{image.name}</h3>
                            <p className="text-sm text-gray-500">{formatDate(image.date)}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}