const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get info about the currently uploaded video.
 */
export async function getVideoInfo() {
    const res = await fetch(`${API_BASE}/api/video`);
    if (!res.ok) throw new Error('Failed to get video info');
    return res.json();
}

/**
 * Get a presigned URL for uploading a file to R2.
 * @param {string} fileName
 * @param {string} fileType
 * @param {"video" | "subtitle"} category
 */
export async function getUploadUrl(fileName, fileType, category) {
    const res = await fetch(`${API_BASE}/api/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileType, category }),
    });
    if (!res.ok) throw new Error('Failed to get upload URL');
    return res.json();
}

/**
 * Upload a file directly to R2 using a presigned URL.
 * @param {string} presignedUrl
 * @param {File} file
 * @param {function} onProgress - callback(percentage)
 */
export function uploadFileToR2(presignedUrl, file, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.send(file);
    });
}

/**
 * Delete all video and subtitle files.
 */
export async function deleteVideo() {
    const res = await fetch(`${API_BASE}/api/video`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete video');
    return res.json();
}
