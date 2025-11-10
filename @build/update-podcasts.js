const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DATA_DIR = path.join(__dirname, '../@data');
const PODCASTS_DIR = path.join(DATA_DIR, 'podcasts');
const OUTPUT_FILE = path.join(DATA_DIR, 'podcasts.json');

// Helper function to fetch URL content
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Parse RSS feed and extract podcast metadata
function parseRssFeed(xmlContent) {
  const podcast = {};
  
  // Helper to extract content between tags
  const extract = (tag, content = xmlContent) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
    const match = content.match(regex);
    if (!match) return '';
    
    let value = match[1].trim();
    // Remove CDATA wrapper if present
    value = value.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1').trim();
    return value;
  };

  // Helper to extract attribute value
  const extractAttr = (tag, attr, content = xmlContent) => {
    const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`, 'i');
    const match = content.match(regex);
    return match ? match[1] : '';
  };

  // Extract channel-level metadata
  const channelMatch = xmlContent.match(/<channel>([\s\S]*?)<\/channel>/i);
  const channelContent = channelMatch ? channelMatch[1] : xmlContent;

  podcast.title = extract('title', channelContent);
  podcast.description = extract('description', channelContent);
  podcast.link = extract('link', channelContent);
  podcast.author = extract('itunes:author', channelContent) || extract('author', channelContent);
  podcast.lastBuildDate = extract('lastBuildDate', channelContent) || extract('pubDate', channelContent);
  
  // iTunes-specific fields
  podcast.subtitle = extract('itunes:subtitle', channelContent);
  podcast.summary = extract('itunes:summary', channelContent);
  podcast.image = extractAttr('itunes:image', 'href', channelContent);
  
  // If no iTunes image, try RSS image
  if (!podcast.image) {
    podcast.image = extract('url', extract('image', channelContent));
  }

  podcast.category = extract('itunes:category', channelContent);
  podcast.explicit = extract('itunes:explicit', channelContent);
  
  return podcast;
}

// Main function to process all podcast files
async function updatePodcasts() {
  try {
    console.log('Starting podcast data update...');
    
    // Read all podcast configuration files
    const podcastFiles = fs.readdirSync(PODCASTS_DIR)
      .filter(file => file.endsWith('.json'));
    
    console.log(`Found ${podcastFiles.length} podcast(s)`);
    
    const podcasts = [];
    
    for (const file of podcastFiles) {
      const filePath = path.join(PODCASTS_DIR, file);
      const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`Processing ${file}...`);
      
      try {
        // Fetch RSS feed
        const rssContent = await fetchUrl(config.rssUrl);
        const metadata = parseRssFeed(rssContent);
        // Combine config and metadata
        const podcast = {
          id: path.basename(file, '.json'),
          ...metadata,
          rssUrl: config.rssUrl,
          youtubeUrl: config.youTubeUrl || null,
          applePodcastId: config.applePodcastId || null,
          tags: config.tags || []
        };
        podcasts.push(podcast);
        console.log(`✓ Successfully processed ${podcast.title}`);
      } catch (error) {
        console.error(`✗ Error processing ${file}:`, error.message);
      }
    }
    
    // Write combined JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(podcasts, null, 2));
    console.log(`\n✓ Successfully wrote ${podcasts.length} podcast(s) to podcasts.json`);
    
  } catch (error) {
    console.error('Error updating podcasts:', error);
    process.exit(1);
  }
}

// Run the update
updatePodcasts();
