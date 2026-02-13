
export const EMBED_DEFINITIONS = [
  {
    type: 'youtube',
    title: 'YouTube',
    hostnames: ['youtube.com', 'youtu.be'],
    minWidth: 300,
    minHeight: 300,
    width: 720,
    height: 500,
    doesResize: true,
    toEmbedUrl: (url: string) => {
      const urlObj = new URL(url)
      const path = urlObj.pathname
      const query = urlObj.searchParams

      if (path.includes('watch')) {
        return `https://www.youtube.com/embed/${query.get('v')}`
      }
      if (path.includes('embed')) {
        return url
      }
      if (urlObj.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed${path}`
      }
      return url
    },
  },
  {
    type: 'google_maps',
    title: 'Google Maps',
    hostnames: ['google.com/maps', 'maps.google.com'],
    minWidth: 300,
    minHeight: 300,
    width: 720,
    height: 500,
    doesResize: true,
    toEmbedUrl: (url: string) => {
      if (url.includes('/embed')) return url
      
      // Basic check, Google Maps URL structure is complex
      // Often users will copy the normal URL, not the embed one.
      // Tldraw's default embed handling is quite sophisticated, 
      // but for a simple custom implementation we might need to rely on the user providing a valid link 
      // or use a simple iframe if possible.
      // However, Google Maps often refuses direct iframing of the main site without the 'embed' API.
      // For now, we will return the URL and let Tldraw's specific logic (if any) or generic iframe handle it.
      // Actually, Tldraw has built-in embedding. We should try to leverage that if possible?
      // But here we are just creating an 'embed' shape. Tldraw's EmbedShapeUtil handles the rendering.
      // It expects { url } in props.
      return url
    },
  },
  {
    type: 'figma',
    title: 'Figma',
    hostnames: ['figma.com'],
    minWidth: 300,
    minHeight: 300,
    width: 720,
    height: 500,
    doesResize: true,
    toEmbedUrl: (url: string) => {
        if(url.includes('embed')) return url
        return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`
    }
  },
  {
    type: 'codesandbox',
    title: 'CodeSandbox',
    hostnames: ['codesandbox.io'],
    minWidth: 300,
    minHeight: 300,
    width: 720,
    height: 500,
    doesResize: true,
    toEmbedUrl: (url: string) => {
        if(url.includes('embed')) return url
        return url.replace('/s/', '/embed/')
    }
  },
   {
    type: 'codepen',
    title: 'CodePen',
    hostnames: ['codepen.io'],
    minWidth: 300,
    minHeight: 300,
    width: 720,
    height: 500,
    doesResize: true,
    toEmbedUrl: (url: string) => {
        if(url.includes('embed')) return url
        return url.replace('/pen/', '/embed/')
    }
  },
  {
    type: 'scratch',
    title: 'Scratch',
    hostnames: ['scratch.mit.edu'],
    minWidth: 300,
    minHeight: 300,
    width: 520,
    height: 400,
    doesResize: false,
    toEmbedUrl: (url: string) => {
        if(url.includes('embed')) return url
        return `${url}/embed`
    }
  },
  {
    type: 'generic',
    title: 'Embed',
    hostnames: [],
    minWidth: 300,
    minHeight: 300,
    width: 720,
    height: 500,
    doesResize: true,
    toEmbedUrl: (url: string) => url,
  },
]

export const getEmbedDef = (type: string) => {
    return EMBED_DEFINITIONS.find(d => d.type === type) || EMBED_DEFINITIONS[EMBED_DEFINITIONS.length - 1]
}
