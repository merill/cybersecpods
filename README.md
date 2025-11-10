# Cybersecurity Podcasts

A curated collection of cybersecurity podcasts covering identity, security, and technology.

## Features

- 📡 **Automated RSS Feed Updates**: Automatically fetches the latest podcast metadata from RSS feeds
- 🎨 **Multiple View Modes**: Toggle between card and table views
- 🔍 **Rich Metadata**: Displays podcast images, descriptions, tags, and links
- 🎯 **Categorized**: Filter podcasts by tags like "Microsoft Entra", "Identity", "Security"
- 🔗 **Quick Links**: Direct links to YouTube channels, Apple Podcasts, and podcast websites

## Adding a New Podcast

To add a new podcast to the collection:

1. Create a new JSON file in the `@data/podcasts/` folder with a unique name (e.g., `podcastname.json`)
2. Add the following structure:

```json
{
  "rssUrl": "https://example.com/feed/podcast.rss",
  "youTubeUrl": "https://www.youtube.com/@YourChannel",
  "applePodcastId": "1234567890",
  "tags": ["Security", "Technology", "Your Category"]
}
```

### Required Fields

- **rssUrl**: The RSS feed URL for the podcast (must be in iTunes format)

### Optional Fields

- **youTubeUrl**: Link to the podcast's YouTube channel
- **applePodcastId**: The podcast ID from Apple Podcasts (the numbers in the URL)
- **tags**: Array of tags to categorize the podcast

### Example

See `@data/podcasts/entrachat.json` for a complete example.

## Building the Site

```bash
# Install dependencies
npm install

# Update podcasts from RSS feeds
npm run update:podcasts

# Run development server
npm run dev

# Build for production
npm run build
```

The build process automatically:

1. Reads all JSON files from `@data/podcasts/`
2. Fetches RSS feeds from each podcast
3. Parses the iTunes podcast format
4. Generates a combined `@data/podcasts.json` file
5. Builds the static site

## RSS Feed Format

The site expects RSS feeds to follow the [iTunes podcast requirements](https://podcasters.apple.com/support/823-podcast-requirements). Key fields extracted include:

- `title` - Podcast name
- `description` - Full podcast description
- `itunes:subtitle` - Short description
- `itunes:image` - Podcast artwork
- `itunes:author` - Creator/host name
- `link` - Podcast website URL
- `lastBuildDate` - Last update date

## Technology Stack

- **Next.js 13** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons

## Feedback

If you have any feedback or suggestions, please feel free to reach out to me on Twitter [@merill](https://twitter.com/merill) or [LinkedIn](https://linkedin.com/in/merill).
