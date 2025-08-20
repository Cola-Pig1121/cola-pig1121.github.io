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

// 生成带日期文件夹的文件名
export const generateDateFolderFileName = (originalName: string, type: 'image' | 'video', tags: string[] = []): string => {
  const d = new Date()
  const extension = originalName.split('.').pop() || (type === 'image' ? 'png' : 'mp4')
  const dateFolder = d.toISOString().split('T')[0] // YYYY-MM-DD格式
  const time = d.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS格式
  const randomSuffix = Math.random().toString(36).substr(2, 6)
  const folder = type === 'image' ? 'images' : 'videos'
  
  // 处理标签：将标签添加到文件名中，用下划线分隔
  const tagString = tags.length > 0 ? `_${tags.join('_')}` : ''
  
  // 保留原始文件名（去掉扩展名）
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  const fileName = `${nameWithoutExt}_${time}-${randomSuffix}${tagString}.${extension}`
  
  return `${folder}/${dateFolder}/${fileName}`
}

// 从文件名中提取标签
export const extractTagsFromFileName = (fileName: string): string[] => {
  // 移除扩展名
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
  // 查找标签部分（原文件名_时间戳-随机字符_标签格式）
  const tagMatch = nameWithoutExt.match(/_\d{2}-\d{2}-\d{2}-[a-z0-9]+_(.+)$/)
  if (tagMatch && tagMatch[1]) {
    return tagMatch[1].split('_').filter(tag => tag.length > 0)
  }
  return []
}

// 从文件名中移除时间戳和标签，显示原始文件名
export const getDisplayFileName = (fileName: string): string => {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
  const extension = fileName.split('.').pop()
  
  // 提取原始文件名（去掉时间戳和标签部分）
  const originalNameMatch = nameWithoutExt.match(/^(.+?)_\d{2}-\d{2}-\d{2}-[a-z0-9]+/)
  if (originalNameMatch && originalNameMatch[1]) {
    return `${originalNameMatch[1]}.${extension}`
  }
  
  // 如果不匹配新格式，直接返回原文件名
  return fileName
}

// 上传文件到GitHub（按日期文件夹分类，支持标签）
export const uploadFileToGitHub = async (
  file: File,
  type: 'image' | 'video' = 'image',
  tags: string[] = []
): Promise<string> => {
  try {
    const path = generateDateFolderFileName(file.name, type, tags)
    const uploadUrl = `${GITHUB_API_BASE}/repos/${REPO}/contents/${path}`
    
    // 将文件转换为base64
    const content = await fileToBase64(file)
    
    const body = {
      branch: 'main',
      message: `upload ${type} to ${type === 'image' ? 'images' : 'videos'} folder with date structure`,
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

// 递归获取指定文件夹中的所有文件（包括子文件夹）
const getFilesFromFolder = async (folder: 'images' | 'videos'): Promise<GitHubFile[]> => {
  const allFiles: GitHubFile[] = []
  
  const fetchFolderContents = async (path: string): Promise<void> => {
    try {
      const token = getGitHubToken()
      const response = await axios.get(
        `${GITHUB_API_BASE}/repos/${REPO}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
      )

      if (!Array.isArray(response.data)) {
        return
      }

      for (const item of response.data) {
        if (item.type === 'file') {
          allFiles.push(item)
        } else if (item.type === 'dir') {
          // 递归获取子文件夹中的文件
          await fetchFolderContents(item.path)
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // 文件夹不存在，跳过
        return
      }
      console.error(`Get files from ${path} failed:`, error)
    }
  }

  await fetchFolderContents(folder)
  return allFiles
}

// 从文件路径提取日期（基于新的文件夹结构：images/YYYY-MM-DD/文件名）
export const extractDateFromFilePath = (filePath: string): string => {
  const pathParts = filePath.split('/')
  if (pathParts.length >= 2) {
    const dateFolder = pathParts[1]
    const dateMatch = dateFolder.match(/^(\d{4}-\d{2}-\d{2})$/)
    if (dateMatch) {
      return dateMatch[1]
    }
  }
  return new Date().toISOString().split('T')[0]
}

// 获取图片文件列表
export const getImages = async () => {
  const imageFiles = await getFilesFromFolder('images')
  
  return imageFiles.map(file => ({
    name: file.name,
    displayName: getDisplayFileName(file.name),
    url: `https://fastly.jsdelivr.net/gh/${REPO}@main/${file.path}`,
    date: extractDateFromFilePath(file.path),
    tags: extractTagsFromFileName(file.name),
    size: file.size,
    path: file.path
  }))
}

// 获取视频文件列表
export const getVideos = async () => {
  const videoFiles = await getFilesFromFolder('videos')
  
  return videoFiles.map(file => ({
    name: file.name,
    displayName: getDisplayFileName(file.name),
    url: `https://fastly.jsdelivr.net/gh/${REPO}@main/${file.path}`,
    date: extractDateFromFilePath(file.path),
    tags: extractTagsFromFileName(file.name),
    size: file.size,
    path: file.path
  }))
}

// 获取所有现有标签
export const getAllTags = async (): Promise<string[]> => {
  try {
    const [images, videos] = await Promise.all([getImages(), getVideos()])
    const allFiles = [...images, ...videos]
    
    const tagsSet = new Set<string>()
    allFiles.forEach(file => {
      file.tags.forEach(tag => tagsSet.add(tag))
    })
    
    return Array.from(tagsSet).sort()
  } catch (error) {
    console.error('获取标签失败:', error)
    return []
  }
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
