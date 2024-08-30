function isValidVideoData(video) {
    return (
      typeof video === 'object' &&
      typeof video.title === 'string' &&
      typeof video.url === 'string' &&
      typeof video.viewCount === 'string' &&
      typeof video.date === 'string'
    );
  }
  
  function sortVideosByViews(videos) {
    return videos
      .filter(isValidVideoData)
      .sort((a, b) => {
        const viewsA = parseInt(a.viewCount.replace(/[^\d]/g, '')) || 0;
        const viewsB = parseInt(b.viewCount.replace(/[^\d]/g, '')) || 0;
        return viewsB - viewsA; // Sort in descending order
      });
  }
  
  function generateCSV(videos) {
    const headers = ['Rank', 'Date', 'Title', 'URL', 'Views'];
    const rows = videos.map((v, index) => 
      `${index + 1},${v.date},"${v.title.replace(/"/g, '""')}",${v.url},${v.viewCount}`
    );
    return [headers.join(','), ...rows].join('\n');
  }
  
  function processVideoData(data, sender) {
    console.log("Processing video data in background script");
    if (!Array.isArray(data)) {
      console.error("Invalid data format received");
      return;
    }
    console.log(`Received ${data.length} videos for processing`);
    
    // Sort all videos by views
    const sortedVideos = sortVideosByViews(data);
    console.log(`Sorted ${sortedVideos.length} valid videos`);
    
    // Limit to top 100 videos
    const topVideos = sortedVideos.slice(0, 100);
    console.log(`Limited to top ${topVideos.length} videos`);
    
    const csvContent = generateCSV(topVideos);
    console.log("CSV content generated, sending to content script for download");
    
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'downloadCSV',
      content: csvContent,
      fileName: 'top_100_youtube_videos.csv'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error initiating download:", chrome.runtime.lastError);
      } else {
        console.log("Download initiated in content script");
      }
    });
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'processVideoData') {
      console.log("Received processVideoData message in background script");
      processVideoData(message.data, sender);
      sendResponse({status: 'processing'});
    }
    return true; // Keeps the message channel open for asynchronous response
  });
  
  console.log('Background script loaded');