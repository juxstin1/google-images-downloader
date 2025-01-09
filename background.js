// Helper function to get file extension from MIME type
function getFileExtension(mimeType) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/bmp': 'bmp'
  };
  return extensions[mimeType] || 'png';
}

// Helper function to generate a filename
function generateFilename(originalUrl, mimeType) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const urlFilename = originalUrl.split('/').pop().split('?')[0].split('#')[0];
  const sanitizedFilename = urlFilename.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  return `${sanitizedFilename}_${timestamp}.png`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { imageUrl } = message;

  // Download and convert the image
  fetch(imageUrl)
    .then(response => {
      const contentType = response.headers.get('content-type');
      return response.blob().then(blob => ({ blob, contentType }));
    })
    .then(async ({ blob, contentType }) => {
      try {
        // Create an image bitmap from the blob
        const imageBitmap = await createImageBitmap(blob);
        
        // Create a canvas with the same dimensions
        const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('2d');

        // Draw the image maintaining transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageBitmap, 0, 0);

        // Convert to PNG with transparency support
        const pngBlob = await canvas.convertToBlob({
          type: 'image/png',
          quality: 1.0
        });

        // Create object URL for download
        const url = URL.createObjectURL(pngBlob);
        const filename = generateFilename(imageUrl, contentType);

        // Trigger download
        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false
        }, () => {
          // Clean up the object URL after download starts
          URL.revokeObjectURL(url);
        });

      } catch (error) {
        console.error('Error converting image:', error);
        // Fallback: download original if conversion fails
        chrome.downloads.download({
          url: imageUrl,
          filename: generateFilename(imageUrl, blob.type),
          saveAs: false
        });
      }
    })
    .catch(error => {
      console.error('Error downloading image:', error);
    });
  
  return true; // Keep the message channel open for async response
});
