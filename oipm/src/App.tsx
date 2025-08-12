import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout'
import HomePage from '@/pages/home'
import ImagesPage from '@/pages/images'
import VideosPage from '@/pages/videos'
import UploadPage from '@/pages/upload'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/images" element={<ImagesPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </Layout>
  )
}

export default App