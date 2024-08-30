function extractDataFromVideoElement(videoElement) {
    try {
      const title = videoElement.title || 'No Title';
      const url = videoElement.href || 'No URL';
      const viewCountElement = videoElement.closest('ytd-video-renderer')?.querySelector('#metadata-line');
      let viewCount = 'N/A';
      if (viewCountElement) {
        const viewMatch = viewCountElement.textContent.match(/[\d,]+ views/);
        viewCount = viewMatch ? viewMatch[0] : 'N/A';
      }
      const date = new Date().toLocaleDateString();
  
      return {title, url, viewCount, date};
    } catch (error) {
      console.error('Error extracting video data:', error);
      return {
        title: 'Error',
        url: 'Error',
        viewCount: 'Error',
        date: new Date().toLocaleDateString()
      };
    }
  }
  
  function observeVideoElements(observer) {
    document.querySelectorAll('#video-title-link').forEach(video => observer.observe(video));
  }
  
  async function waitForScrollCompletion() {
    return new Promise(resolve => {
      let lastScrollTop = 0;
      let noChangeCount = 0;
      const scrollInterval = setInterval(() => {
        window.scrollBy(0, 1000);
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        console.log(`Scrolled to: ${currentScrollTop}`);
        
        if (currentScrollTop === lastScrollTop) {
          noChangeCount++;
          if (noChangeCount > 5) {
            console.log("Reached bottom of page or no more content loading");
            clearInterval(scrollInterval);
            resolve();
          }
        } else {
          noChangeCount = 0;
        }
        lastScrollTop = currentScrollTop;
      }, 1000);
    });
  }
  
  function createVideoObserver(allVideos) {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const videoElement = entry.target;
          const videoData = extractDataFromVideoElement(videoElement);
          if (videoData.title !== 'Error') {
            allVideos.push(videoData);
            console.log("Video data extracted:", videoData);
          }
        }
      });
    }, {threshold: 0.1});
  }
  
  async function extractVideoData() {
    console.log("Starting video extraction");
    let allVideos = [];
    
    const observer = createVideoObserver(allVideos);
    observeVideoElements(observer);
  
    console.log("Starting scroll process");
    await waitForScrollCompletion();
    console.log("Scroll process completed");
  
    observer.disconnect();
  
    console.log(`Total videos extracted: ${allVideos.length}`);
    return allVideos;
  }
  
  function downloadCSV(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startExtraction') {
      console.log("Received startExtraction message");
      extractVideoData().then((videos) => {
        console.log("Extraction completed, sending data to background script");
        chrome.runtime.sendMessage({action: 'processVideoData', data: videos}, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending data to background script:", chrome.runtime.lastError);
          } else {
            console.log("Data sent successfully to background script");
          }
        });
        sendResponse({status: 'completed'});
      }).catch((error) => {
        console.error('Extraction failed:', error);
        sendResponse({status: 'error', message: error.toString()});
      });
      return true; // Indicates that the response is sent asynchronously
    } else if (message.action === 'downloadCSV') {
      downloadCSV(message.content, message.fileName);
      sendResponse({status: 'downloaded'});
    }
  });
  
  console.log('YouTube Video Extractor content script loaded');