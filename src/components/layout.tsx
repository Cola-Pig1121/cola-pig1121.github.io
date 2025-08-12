import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, Image, Video, Upload } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo和标题 */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src="/favicon.ico" 
                alt="信奥图床" 
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
              <Link to="/" className="text-lg sm:text-xl font-bold text-blue-800 hover:text-blue-900 truncate">
                信奥图床
              </Link>
            </div>

            {/* 导航链接 - 桌面版 */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/" className="flex items-center space-x-2">
                  <Home className="w-4 h-4" />
                  <span>首页</span>
                </Link>
              </Button>

              <Button
                variant={isActive('/images') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/images" className="flex items-center space-x-2">
                  <Image className="w-4 h-4" />
                  <span>图片</span>
                </Link>
              </Button>

              <Button
                variant={isActive('/videos') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/videos" className="flex items-center space-x-2">
                  <Video className="w-4 h-4" />
                  <span>视频</span>
                </Link>
              </Button>

              <Button
                variant={isActive('/upload') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/upload" className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>上传</span>
                </Link>
              </Button>
            </div>

            {/* 导航链接 - 移动版 */}
            <div className="flex md:hidden items-center space-x-1">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/" className="p-2">
                  <Home className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                variant={isActive('/images') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/images" className="p-2">
                  <Image className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                variant={isActive('/videos') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/videos" className="p-2">
                  <Video className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                variant={isActive('/upload') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/upload" className="p-2">
                  <Upload className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* 底部 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>Made by <a href="https://bugs8.v6.army" className="text-blue-600 hover:text-blue-800">Cola Pig</a> & 落叶听枫TC</p>
          </div>
        </div>
      </footer>
    </div>
  )
}