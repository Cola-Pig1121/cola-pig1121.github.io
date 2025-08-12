import axios from 'axios'

// GitHub API配置
const GITHUB_API_BASE = 'https://api.github.com'
const REPO = 'colapig081121/files'

// 从环境变量获取GitHub token
const getGitHubToken = (): string => {
  const token = import.meta.env.VITE_GITHUB_TOKEN
  if (!token) {
    throw new Error('GitHub token not found. Please set VITE_GITHUB_TOKEN in your .env file.')
  }
  return token
}

// 创建axios实例
const githubApi = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  }
})

// 添加请求拦截器来添加token
githubApi.interceptors.request.use((config) => {
  try {
    const token = getGitHubToken()
    config.headers.Authorization = `token ${token}`
  } catch (error) {
    console.warn('GitHub token not available:', error)
  }
  return config
})

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
}

export interface UploadFileParams {
  path: string
  content: string
  message: string
  branch?: string
}

export interface UploadFileResponse {
  content: GitHubFile
  commit: {
    sha: string
    url: string
  }
}

// 将文件转换为Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // 移除data:image/jpeg;base64,前缀，只保留base64内容
      const base64Content = result.split(',')[1]
      resolve(base64Content)
    }
    reader.onerror = error => reject(error)
  })
}

// 生成带时间戳的文件名（按文件夹分类）
export const generateTimestampFileName = (originalName: string, type: 'image' | 'video'): string => {
  const d = new Date()
  const extension = originalName.split('.').pop() || (type === 'image' ? 'png' : 'mp4')
  const timestamp = d.toISOString().split('T')[0] // YYYY-MM-DD格式
  const time = d.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS格式
  const randomSuffix = Math.random().toString(36).substr(2, 6)
  const folder = type === 'image' ? 'images' : 'videos'
  return `${folder}/${timestamp}-${time}-${randomSuffix}.${extension}`
}

// 上传文件到GitHub（按文件夹分类）
export const uploadFileToGitHub = async (
  file: File,
  type: 'image' | 'video' = 'image'
): Promise<string> => {
  try {
    const path = generateTimestampFileName(file.name, type)
    const uploadUrl = `${GITHUB_API_BASE}/repos/${REPO}/contents/${path}`
    
    // 将文件转换为base64
    const content = await fileToBase64(file)
    
    const body = {
      branch: 'main',
      message: `upload ${type} to ${type === 'image' ? 'images' : 'videos'} folder`,
      content: content,
      path
    }
    
    const token = getGitHubToken()
    const headers = {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    }
    
    await axios.put(uploadUrl, body, { headers })
    
    // 返回CDN地址
    return `https://fastly.jsdelivr.net/gh/${REPO}@main/${path}`
  } catch (error) {
    console.error('Upload to GitHub failed:', error)
    throw new Error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 获取指定文件夹中的文件
const getFilesFromFolder = async (folder: 'images' | 'videos'): Promise<GitHubFile[]> => {
  try {
    const token = getGitHubToken()
    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${REPO}/contents/${folder}`,
      {
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    )

    if (!Array.isArray(response.data)) {
      return []
    }

    return response.data.filter((item: GitHubFile) => item.type === 'file')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // 文件夹不存在，返回空数组
      return []
    }
    console.error(`Get files from ${folder} folder failed:`, error)
    throw new Error(`获取${folder}文件夹失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 从文件名提取日期（基于新的命名格式：YYYY-MM-DD-HH-MM-SS-随机字符.扩展名）
export const extractDateFromFileName = (fileName: string): string => {
  const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/)
  return dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0]
}

// 获取图片文件列表
export const getImages = async () => {
  const imageFiles = await getFilesFromFolder('images')
  
  return imageFiles.map(file => ({
    name: file.name,
    url: `https://fastly.jsdelivr.net/gh/${REPO}@main/${file.path}`,
    date: extractDateFromFileName(file.name),
    size: file.size
  }))
}

// 获取视频文件列表
export const getVideos = async () => {
  const videoFiles = await getFilesFromFolder('videos')
  
  return videoFiles.map(file => ({
    name: file.name,
    url: `https://fastly.jsdelivr.net/gh/${REPO}@main/${file.path}`,
    date: extractDateFromFileName(file.name),
    size: file.size
  }))
}

// 检查GitHub连接状态
export const checkGitHubConnection = async (): Promise<boolean> => {
  try {
    const token = getGitHubToken()
    await axios.get(`${GITHUB_API_BASE}/repos/${REPO}`, {
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
    return true
  } catch (error) {
    console.error('GitHub connection failed:', error)
    return false
  }
}
