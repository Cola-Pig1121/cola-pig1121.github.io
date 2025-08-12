/**
 * 生成视频缩略图
 * @param file 视频文件
 * @param time 截取时间点（秒），默认为1秒
 * @returns Promise<string> 返回base64格式的缩略图
 */
export const generateVideoThumbnail = (file: File, time: number = 1): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('无法创建canvas上下文'));
      return;
    }

    video.addEventListener('loadedmetadata', () => {
      // 设置canvas尺寸，保持视频比例
      const aspectRatio = video.videoWidth / video.videoHeight;
      const maxWidth = 400;
      const maxHeight = 300;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 设置视频时间点
      video.currentTime = Math.min(time, video.duration);
    });

    video.addEventListener('seeked', () => {
      try {
        // 绘制视频帧到canvas
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 转换为base64
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('视频加载失败'));
    });

    // 设置视频源
    video.src = URL.createObjectURL(file);
    video.load();
  });
};

/**
 * 从视频URL生成缩略图
 * @param videoUrl 视频URL
 * @param time 截取时间点（秒），默认为1秒
 * @returns Promise<string> 返回base64格式的缩略图
 */
export const generateThumbnailFromUrl = (videoUrl: string, time: number = 1): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('无法创建canvas上下文'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.addEventListener('loadedmetadata', () => {
      // 设置canvas尺寸
      const aspectRatio = video.videoWidth / video.videoHeight;
      const maxWidth = 400;
      const maxHeight = 300;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      video.currentTime = Math.min(time, video.duration);
    });

    video.addEventListener('seeked', () => {
      try {
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('视频加载失败'));
    });

    video.src = videoUrl;
    video.load();
  });
};