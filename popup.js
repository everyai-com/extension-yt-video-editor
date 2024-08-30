async function startExtraction() {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = 'Starting extraction...';
  
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      if (!tab.url.includes('youtube.com')) {
        throw new Error('Please navigate to a YouTube channel page before extracting data.');
      }
  
      await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['content.js']
      });
  
      const response = await chrome.tabs.sendMessage(tab.id, {action: 'startExtraction'});
      
      if (response && response.status === 'completed') {
        statusDiv.textContent = 'Extraction completed. CSV file with top 100 videos should download shortly.';
      } else {
        throw new Error('Failed to start extraction process');
      }
    } catch (error) {
      statusDiv.textContent = `An error occurred: ${error.message}`;
      console.error('An error occurred:', error);
    }
  }
  
  document.getElementById('extractButton').addEventListener('click', startExtraction);