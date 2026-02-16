/**
 * Convert SRT subtitle content to WebVTT format.
 * @param {string} srtContent - Raw SRT file content
 * @returns {string} WebVTT formatted string
 */
export function srtToVtt(srtContent) {
    // Normalize line endings
    let content = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Replace SRT timestamp format (comma) with VTT format (period)
    // SRT: 00:01:23,456 --> 00:01:25,789
    // VTT: 00:01:23.456 --> 00:01:25.789
    content = content.replace(
        /(\d{2}:\d{2}:\d{2}),(\d{3})/g,
        '$1.$2'
    );

    // Remove subtitle index numbers (lines that are just a number before timestamps)
    content = content.replace(/^\d+\s*$/gm, '');

    // Clean up excessive blank lines
    content = content.replace(/\n{3,}/g, '\n\n').trim();

    return `WEBVTT\n\n${content}\n`;
}

/**
 * Create a blob URL from VTT content.
 * @param {string} vttContent
 * @returns {string} Blob URL
 */
export function createVttBlobUrl(vttContent) {
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    return URL.createObjectURL(blob);
}

/**
 * Fetch an SRT file from a URL and convert it to a VTT blob URL.
 * @param {string} srtUrl
 * @returns {Promise<string>} VTT blob URL
 */
export async function fetchAndConvertSrt(srtUrl) {
    const res = await fetch(srtUrl);
    const srtContent = await res.text();
    const vttContent = srtToVtt(srtContent);
    return createVttBlobUrl(vttContent);
}
