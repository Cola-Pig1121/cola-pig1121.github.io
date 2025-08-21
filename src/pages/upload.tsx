import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TagInput } from '@/components/ui/tag-input'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTitle, DialogDescription, VisuallyHidden } from '@/components/ui/dialog'
import { Upload, File, X, CheckCircle, AlertCircle, Image, Video, CheckSquare, Square, Tag } from 'lucide-react'
import { uploadFileToGitHub, getAllTags } from '@/services/github'

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  url?: string
  error?: string
  tags: string[]
}

export default function UploadPage() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [existingTags, setExistingTags] = useState<string[]>([])
  
  // 多选功能状态
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [newTags, setNewTags] = useState<string[]>([])

  // 加载现有标签
  useEffect(() => {
    const loadExistingTags = async () => {
      try {
        const tags = await getAllTags()
        setExistingTags(tags)
      } catch (error) {
        console.error('加载现有标签失败:', error)
      }
    }
    loadExistingTags()
  }, [])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // 处理被拒绝的文件
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            alert(`文件 "${file.name}" 超过大小限制。视频文件最大20MB，图片文件最大20MB。`)
          }
        })
      })
    }

    // 额外检查视频文件大小
    const validFiles = acceptedFiles.filter(file => {
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? 20 * 1024 * 1024 : 20 * 1024 * 1024 // 视频20MB，图片20MB
      
      if (file.size > maxSize) {
        alert(`文件 "${file.name}" 超过大小限制。${isVideo ? '视频文件最大20MB' : '图片文件最大20MB'}。`)
        return false
      }
      return true
    })

    const newFiles: UploadFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending',
      tags: []
    }))
    
    setUploadFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv']
    },
    multiple: true,
    maxSize: 20 * 1024 * 1024, // 20MB 最大限制
    validator: (file) => {
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? 20 * 1024 * 1024 : 20 * 1024 * 1024 // 视频20MB，图片20MB
      
      if (file.size > maxSize) {
        return {
          code: 'file-too-large',
          message: `文件过大。${isVideo ? '视频文件最大20MB' : '图片文件最大20MB'}。`
        }
      }
      return null
    }
  })

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id))
  }

  // 多选功能函数
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    setSelectedFiles(new Set())
  }

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const selectAllFiles = () => {
    const allFileIds = new Set(uploadFiles.filter(f => f.status === 'pending').map(f => f.id))
    setSelectedFiles(allFileIds)
  }

  const clearSelection = () => {
    setSelectedFiles(new Set())
  }

  const removeSelectedFiles = () => {
    setUploadFiles(prev => prev.filter(f => !selectedFiles.has(f.id)))
    setSelectedFiles(new Set())
    setIsMultiSelectMode(false)
  }

  const openTagDialog = () => {
    setNewTags([])
    setIsTagDialogOpen(true)
  }

  const addTagsToSelectedFiles = () => {
    if (newTags.length === 0 || selectedFiles.size === 0) return

    setUploadFiles(prev => prev.map(f => 
      selectedFiles.has(f.id) 
        ? { ...f, tags: [...new Set([...f.tags, ...newTags])] }
        : f
    ))
    
    setSelectedFiles(new Set())
    setIsTagDialogOpen(false)
    setNewTags([])
    setIsMultiSelectMode(false)
  }

  const uploadToGitHub = async (uploadFile: UploadFile): Promise<void> => {
    const { file, tags } = uploadFile
    const isImage = file.type.startsWith('image/')
    const type = isImage ? 'image' : 'video'
    
    // 更新上传状态
    const updateProgress = (progress: number) => {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress, status: 'uploading' as const }
          : f
      ))
    }

    try {
      // 开始上传
      updateProgress(10)
      
      // 调用GitHub API上传文件（返回CDN URL），传入标签
      const cdnUrl = await uploadFileToGitHub(file, type, tags)
      
      // 上传完成
      updateProgress(100)
      
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              progress: 100, 
              status: 'success' as const,
              url: cdnUrl
            }
          : f
      ))
    } catch (error) {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error' as const,
              error: error instanceof Error ? error.message : '上传失败'
            }
          : f
      ))
    }
  }

  const startUpload = async () => {
    setIsUploading(true)
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
    
    // 按顺序逐个上传文件，间隔0.2秒
    for (let i = 0; i < pendingFiles.length; i++) {
      await uploadToGitHub(pendingFiles[i])
      
      // 如果不是最后一个文件，等待0.2秒
      if (i < pendingFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    setIsUploading(false)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />
    } else if (file.type.startsWith('video/')) {
      return <Video className="w-5 h-5 text-green-500" />
    }
    return <File className="w-5 h-5 text-gray-500" />
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mt-1" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">文件上传</h1>
            <p className="text-sm sm:text-base text-gray-600">
              支持图片和视频文件，自动按时间命名存储到GitHub
              {isMultiSelectMode && selectedFiles.size > 0 && ` (已选择 ${selectedFiles.size} 个文件)`}
            </p>
          </div>
        </div>
        {uploadFiles.length > 0 && (
          <Button 
            onClick={toggleMultiSelectMode} 
            variant={isMultiSelectMode ? "default" : "outline"}
            className="self-start sm:self-auto"
          >
            {isMultiSelectMode ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
            {isMultiSelectMode ? '退出多选' : '多选模式'}
          </Button>
        )}
      </div>

      {/* 拖拽上传区域 */}
      <Card>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 sm:p-8 lg:p-12 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-center">
                <div className="p-3 sm:p-4 bg-gray-100 rounded-full">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  {isDragActive ? '释放文件以开始上传' : '拖拽文件到这里或点击选择'}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mt-2 px-2">
                  支持 PNG, JPG, GIF, WebP 图片格式（最大20MB）和 MP4, AVI, MOV 视频格式（最大20MB），最多同时上传两个文件
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 多选操作栏 */}
      {isMultiSelectMode && uploadFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Button onClick={selectAllFiles} variant="outline" size="sm">
                  全选 ({uploadFiles.filter(f => f.status === 'pending').length})
                </Button>
                <Button onClick={clearSelection} variant="outline" size="sm" disabled={selectedFiles.size === 0}>
                  清空选择
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={openTagDialog} 
                  variant="outline" 
                  size="sm" 
                  disabled={selectedFiles.size === 0}
                >
                  <Tag className="w-4 h-4 mr-1" />
                  添加标签 ({selectedFiles.size})
                </Button>
                <Button 
                  onClick={removeSelectedFiles} 
                  variant="outline" 
                  size="sm" 
                  disabled={selectedFiles.size === 0}
                >
                  <X className="w-4 h-4 mr-1" />
                  删除选中 ({selectedFiles.size})
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
            <DialogDescription>为选中的文件添加标签</DialogDescription>
          </VisuallyHidden>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">为选中的文件添加标签</h3>
              <p className="text-sm text-gray-500">已选择 {selectedFiles.size} 个文件</p>
            </div>
            <TagInput
              tags={newTags}
              onTagsChange={setNewTags}
              existingTags={existingTags}
              placeholder="输入要添加的标签"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={addTagsToSelectedFiles} disabled={newTags.length === 0}>
                添加标签
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 文件列表 */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl">待上传文件 ({uploadFiles.length})</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={startUpload}
                  disabled={isUploading || uploadFiles.every(f => f.status !== 'pending')}
                  className="w-full sm:w-auto"
                >
                  {isUploading ? '上传中...' : '开始上传'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUploadFiles([])}
                  disabled={isUploading}
                  className="w-full sm:w-auto"
                >
                  清空列表
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadFiles.map((uploadFile) => {
              const isSelected = selectedFiles.has(uploadFile.id)
              return (
                <div key={uploadFile.id} className="border rounded-lg p-3 sm:p-4 relative">
                  {isMultiSelectMode && uploadFile.status === 'pending' && (
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleFileSelection(uploadFile.id)}
                        className="bg-white border-2 border-gray-300 shadow-sm"
                      />
                    </div>
                  )}
                  <div 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 ${
                      isMultiSelectMode && uploadFile.status === 'pending' ? 'ml-8' : ''
                    }`}
                    style={isSelected ? { outline: '2px solid #3b82f6', borderRadius: '8px', padding: '8px' } : {}}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {getFileIcon(uploadFile.file)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-2">
                      <Badge variant={
                        uploadFile.status === 'success' ? 'default' :
                        uploadFile.status === 'error' ? 'destructive' :
                        uploadFile.status === 'uploading' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {uploadFile.status === 'pending' && '待上传'}
                        {uploadFile.status === 'uploading' && '上传中'}
                        {uploadFile.status === 'success' && '已完成'}
                        {uploadFile.status === 'error' && '上传失败'}
                      </Badge>
                      {getStatusIcon(uploadFile.status)}
                      {uploadFile.status === 'pending' && !isMultiSelectMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                          className="p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 标签输入区域 */}
                  {uploadFile.status === 'pending' && (
                    <div className="mb-3">
                      <TagInput
                        tags={uploadFile.tags}
                        onTagsChange={(newTags) => {
                          setUploadFiles(prev => prev.map(f => 
                            f.id === uploadFile.id 
                              ? { ...f, tags: newTags }
                              : f
                          ))
                        }}
                        existingTags={existingTags}
                        placeholder="输入标签名称"
                      />
                    </div>
                  )}

                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} className="mb-2" />
                  )}

                  {uploadFile.status === 'error' && uploadFile.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadFile.error}</AlertDescription>
                    </Alert>
                  )}

                  {uploadFile.status === 'success' && uploadFile.url && (
                    <div className="space-y-2">
                      {uploadFile.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-sm text-gray-600">标签:</span>
                          {uploadFile.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          上传成功！文件已保存到: 
                          <a 
                            href={uploadFile.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline ml-1"
                          >
                            查看文件
                          </a>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>• 支持拖拽上传和点击选择文件两种方式</p>
          <p>• 图片文件将保存到 GitHub 仓库的 images 文件夹（最大20MB）</p>
          <p>• 视频文件将保存到 GitHub 仓库的 videos 文件夹（最大20MB）</p>
          <p>• 上传完成后通过 CDN 加速访问</p>
          <p>• 上传完成后可在对应的图片或视频页面查看</p>
        </CardContent>
      </Card>
    </div>
  )
}