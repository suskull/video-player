import { useState, useEffect, useRef } from 'react'
import { getVideoInfo } from '../utils/api.js'
import { fetchAndConvertSrt } from '../utils/subtitleParser.js'

function WatchPage() {
  const [videoData, setVideoData] = useState(null)
  const [subtitleUrl, setSubtitleUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    loadVideo()
  }, [])

  async function loadVideo() {
    try {
      setLoading(true)
      setError(null)
      const data = await getVideoInfo()

      if (!data.video) {
        setVideoData(null)
        return
      }

      setVideoData(data)

      // If subtitle exists, convert SRT to VTT
      if (data.subtitle) {
        try {
          const vttUrl = await fetchAndConvertSrt(data.subtitle.url)
          setSubtitleUrl(vttUrl)
        } catch (e) {
          console.warn('Failed to load subtitle:', e)
        }
      }
    } catch (err) {
      setError('Failed to load video. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      if (subtitleUrl) URL.revokeObjectURL(subtitleUrl)
    }
  }, [subtitleUrl])

  if (loading) {
    return (
      <div className="watch-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="watch-page">
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h2>{error}</h2>
          <button className="btn btn-primary" onClick={loadVideo}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!videoData?.video) {
    return (
      <div className="watch-page">
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h2>No video uploaded yet</h2>
          <p>Upload a video to start watching</p>
          <a href="/upload" className="btn btn-primary">
            Upload Video
          </a>
        </div>
      </div>
    )
  }

  const formatSize = (bytes) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
    return `${(bytes / 1e3).toFixed(0)} KB`
  }

  return (
    <div className="watch-page">
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-player"
          controls
          autoPlay
          crossOrigin="anonymous"
          key={videoData.video.url}
        >
          <source src={videoData.video.url} />
          {subtitleUrl && (
            <track
              kind="subtitles"
              src={subtitleUrl}
              srcLang="en"
              label="Subtitles"
              default
            />
          )}
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="video-info">
        <div className="video-meta">
          <span className="video-name">{videoData.video.key}</span>
          <span className="video-size">{formatSize(videoData.video.size)}</span>
          {videoData.subtitle && (
            <span className="subtitle-badge">
              📝 Subtitles loaded
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default WatchPage
