import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, File, X, CheckCircle, AlertCircle, Image, Video } from 'lucide-react'
import { uploadFileToGitHub } from '@/services/github'

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

export default function UploadPage() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

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
      const isImage = file.type.startsWith('image/')
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
      status: 'pending'
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
      const isImage = file.type.startsWith('image/')
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


  const uploadToGitHub = async (uploadFile: UploadFile): Promise<void> => {
    const { file } = uploadFile
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
      
      // 调用GitHub API上传文件（返回CDN URL）
      const cdnUrl = await uploadFileToGitHub(file, type)
      
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
    
    // 并发上传所有文件
    await Promise.all(pendingFiles.map(uploadToGitHub))
    
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
      <div className="flex items-start space-x-3">
        <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mt-1" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">文件上传</h1>
          <p className="text-sm sm:text-base text-gray-600">支持图片和视频文件，自动按时间命名存储到GitHub</p>
        </div>
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
            {uploadFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="border rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
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
                    {uploadFile.status === 'pending' && (
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
                )}
              </div>
            ))}
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
          <p>• 文件将自动按当前时间命名，格式为：YYYY-MM-DD-HH-MM-SS-随机字符.扩展名</p>
          <p>• 上传完成后通过 CDN 加速访问</p>
          <p>• 上传完成后可在对应的图片或视频页面查看</p>
        </CardContent>
      </Card>
    </div>
  )
}