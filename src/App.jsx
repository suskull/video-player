import { Routes, Route } from 'react-router-dom'
import WatchPage from './pages/WatchPage.jsx'
import UploadPage from './pages/UploadPage.jsx'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <a href="/" className="logo">
          <span className="logo-icon">▶</span>
          <span className="logo-text">ToNhu</span>
        </a>
        <nav className="nav-links">
          <a href="/" className="nav-link">Watch</a>
          <a href="/upload" className="nav-link nav-link-upload">Upload</a>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<WatchPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
