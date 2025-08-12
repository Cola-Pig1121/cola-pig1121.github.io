import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Image, Video, Upload, Github } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* 欢迎区域 */}
      <div className="text-center space-y-4 sm:space-y-6">
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 px-4">
            欢迎使用信奥图床
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            专为信奥人打造的图片和视频托管平台，支持GitHub存储，快速分享您的作品
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/upload">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              开始上传
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
            <Link to="/images">
              <Image className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              浏览图片
            </Link>
          </Button>
        </div>
      </div>

      {/* 功能卡片区域 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>图片管理</CardTitle>
            </div>
            <CardDescription>
              按日期分组展示图片，支持快速预览和分享
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/images">查看图片</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Video className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>视频管理</CardTitle>
            </div>
            <CardDescription>
              在线播放视频，支持多种格式和高清播放
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/videos">查看视频</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>文件上传</CardTitle>
            </div>
            <CardDescription>
              拖拽上传文件，自动按时间命名并存储到GitHub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/upload">上传文件</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 特色介绍 */}
      <div className="bg-white rounded-lg p-8 border">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-gray-100 rounded-full">
              <Github className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">基于GitHub存储</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            所有文件都存储在GitHub仓库中，确保数据安全可靠。支持实时同步，随时随地访问您的文件。
          </p>
        </div>
      </div>

      {/* 口号区域 */}
      <div className="text-center bg-blue-50 rounded-lg p-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          请大声喊出我们的口号：
        </h3>
        <p className="text-blue-800 font-medium">
          没有bug的代码不是好代码<br />
          能KO一个bug的只有更多的bug!!!
        </p>
      </div>
    </div>
  )
}