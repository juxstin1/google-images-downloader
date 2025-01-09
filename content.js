// Inject styles for download button
const style = document.createElement('style');
style.textContent = `
  .image-container {
    position: relative !important;
    display: inline-block;
  }
  .download-btn {
    position: absolute !important;
    top: 8px !important;
    right: 8px !important;
    background: rgba(66, 133, 244, 0.9) !important;
    color: white !important;
    border: none !important;
    border-radius: 4px !important;
    padding: 6px 12px !important;
    font-size: 13px !important;
    font-family: Arial, sans-serif !important;
    cursor: pointer !important;
    z-index: 1000 !important;
    opacity: 0;
    transition: opacity 0.2s ease-in-out, background-color 0.2s ease-in-out !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
  }
  .download-btn:hover {
    background: rgba(66, 133, 244, 1) !important;
  }
  .image-container:hover .download-btn {
    opacity: 1;
  }
`;
document.head.appendChild(style);

// Function to wrap image in container if needed
function wrapInContainer(img) {
  if (img.parentNode.classList.contains('image-container')) {
    return img.parentNode;
  }
  
  const container = document.createElement('div');
  container.className = 'image-container';
  img.parentNode.insertBefore(container, img);
  container.appendChild(img);
  return container;
}

// Add download buttons to each image
function addDownloadButtons() {
  const images = document.querySelectorAll('img:not([data-download-button])');

  images.forEach((img) => {
    // Skip tiny images
    if (img.width < 50 || img.height < 50) return;
    
    // Mark image as processed
    img.setAttribute('data-download-button', 'true');

    // Create container for positioning
    const container = wrapInContainer(img);

    // Create download button
    const button = document.createElement('button');
    button.className = 'download-btn';
    button.innerHTML = '<span>⬇</span> Save';
    
    // Handle click event
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Visual feedback
      button.style.opacity = '0.7';
      button.textContent = 'Saving...';
      
      try {
        // Get highest quality image URL
        const imageUrl = img.src;
        await chrome.runtime.sendMessage({ imageUrl });
        
        // Success feedback
        button.textContent = 'Saved!';
        setTimeout(() => {
          button.innerHTML = '<span>⬇</span> Save';
        }, 2000);
      } catch (error) {
        button.textContent = 'Error';
        console.error('Failed to download:', error);
      }
    });

    container.appendChild(button);
  });
}

// Initial load
addDownloadButtons();

// Watch for dynamic content
const observer = new MutationObserver((mutations) => {
  const hasNewImages = mutations.some(mutation => 
    Array.from(mutation.addedNodes).some(node => 
      node.nodeName === 'IMG' || (node.getElementsByTagName && node.getElementsByTagName('img').length > 0)
    )
  );
  
  if (hasNewImages) {
    addDownloadButtons();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
