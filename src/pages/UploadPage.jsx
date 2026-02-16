import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUploadUrl, uploadFileToR2, deleteVideo, getVideoInfo } from '../utils/api.js'

function UploadPage() {
  const navigate = useNavigate()

  const [videoFile, setVideoFile] = useState(null)
  const [subtitleFile, setSubtitleFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [existingVideo, setExistingVideo] = useState(null)
  const [checkingExisting, setCheckingExisting] = useState(true)

  const videoInputRef = useRef(null)
  const subtitleInputRef = useRef(null)

  // Check for existing video on mount
  useState(() => {
    async function check() {
      try {
        const data = await getVideoInfo()
        if (data.video) setExistingVideo(data.video)
      } catch (e) {
        // ignore
      } finally {
        setCheckingExisting(false)
      }
    }
    check()
  })

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && isVideoFile(file)) {
      setVideoFile(file)
      setError(null)
    } else {
      setError('Please drop a .mp4 or .mkv file')
    }
  }

  function isVideoFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    return ['mp4', 'mkv'].includes(ext)
  }

  function isSubtitleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    return ext === 'srt'
  }

  function handleVideoSelect(e) {
    const file = e.target.files[0]
    if (file) {
      setVideoFile(file)
      setError(null)
    }
  }

  function handleSubtitleSelect(e) {
    const file = e.target.files[0]
    if (file && isSubtitleFile(file)) {
      setSubtitleFile(file)
    }
  }

  function formatSize(bytes) {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
    return `${(bytes / 1e3).toFixed(0)} KB`
  }

  async function handleUpload() {
    if (!videoFile) return

    try {
      setUploading(true)
      setError(null)
      setProgress(0)

      // Step 1: Delete existing video if any
      if (existingVideo) {
        setStatusText('Removing previous video...')
        await deleteVideo()
      }

      // Step 2: Upload video
      setStatusText('Preparing video upload...')
      const videoContentType = videoFile.type || 'video/mp4'
      const { uploadUrl: videoUploadUrl } = await getUploadUrl(
        videoFile.name,
        videoContentType,
        'video'
      )

      setStatusText('Uploading video...')
      await uploadFileToR2(videoUploadUrl, videoFile, (pct) => {
        setProgress(pct)
      })

      // Step 3: Upload subtitle if provided
      if (subtitleFile) {
        setStatusText('Uploading subtitle...')
        setProgress(0)
        const { uploadUrl: subUploadUrl } = await getUploadUrl(
          subtitleFile.name,
          'text/plain',
          'subtitle'
        )
        await uploadFileToR2(subUploadUrl, subtitleFile, (pct) => {
          setProgress(pct)
        })
      }

      setStatusText('Upload complete!')
      setProgress(100)

      // Navigate to watch page after a brief delay
      setTimeout(() => navigate('/'), 1000)
    } catch (err) {
      console.error('Upload failed:', err)
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteExisting() {
    try {
      await deleteVideo()
      setExistingVideo(null)
    } catch (err) {
      setError('Failed to delete existing video')
    }
  }

  return (
    <div className="upload-page">
      <h1 className="page-title">Upload Video</h1>

      {/* Existing video warning */}
      {existingVideo && !uploading && (
        <div className="existing-warning">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <div>
              <p>A video already exists: <strong>{existingVideo.key}</strong> ({formatSize(existingVideo.size)})</p>
              <p className="warning-hint">Uploading a new video will replace it.</p>
            </div>
          </div>
          <button className="btn btn-danger-outline" onClick={handleDeleteExisting}>
            Delete Existing
          </button>
        </div>
      )}

      {/* Video drop zone */}
      <div
        className={`drop-zone ${dragOver ? 'drop-zone-active' : ''} ${videoFile ? 'drop-zone-selected' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && videoInputRef.current?.click()}
      >
        <input
          ref={videoInputRef}
          type="file"
          accept=".mp4,.mkv"
          onChange={handleVideoSelect}
          hidden
        />
        {videoFile ? (
          <div className="selected-file">
            <div className="file-icon">🎥</div>
            <div className="file-details">
              <span className="file-name">{videoFile.name}</span>
              <span className="file-size">{formatSize(videoFile.size)}</span>
            </div>
            {!uploading && (
              <button
                className="btn-remove"
                onClick={(e) => { e.stopPropagation(); setVideoFile(null) }}
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="drop-prompt">
            <div className="drop-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="drop-text">Drag & drop your video here</p>
            <p className="drop-hint">or click to browse • .mp4, .mkv</p>
          </div>
        )}
      </div>

      {/* Subtitle upload */}
      <div className="subtitle-section">
        <button
          className="btn btn-secondary"
          onClick={() => subtitleInputRef.current?.click()}
          disabled={uploading}
        >
          {subtitleFile ? `📝 ${subtitleFile.name}` : '📝 Add Subtitle (.srt)'}
        </button>
        <input
          ref={subtitleInputRef}
          type="file"
          accept=".srt"
          onChange={handleSubtitleSelect}
          hidden
        />
        {subtitleFile && !uploading && (
          <button
            className="btn-remove-sub"
            onClick={() => setSubtitleFile(null)}
          >
            Remove
          </button>
        )}
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="progress-section">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-info">
            <span className="progress-status">{statusText}</span>
            <span className="progress-percent">{progress}%</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-message">
          <span>❌</span> {error}
        </div>
      )}

      {/* Upload button */}
      <button
        className="btn btn-primary btn-upload"
        onClick={handleUpload}
        disabled={!videoFile || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload & Share'}
      </button>
    </div>
  )
}

export default UploadPage
