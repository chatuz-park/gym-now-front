export function getVideoEmbed(url: string): { type: 'iframe' | 'video'; src: string } {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const id = parsed.searchParams.get('v')
      if (id) return { type: 'iframe', src: `https://www.youtube.com/embed/${id}` }
      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/)
      if (embedMatch) return { type: 'iframe', src: `https://www.youtube.com/embed/${embedMatch[1]}` }
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      if (id) return { type: 'iframe', src: `https://www.youtube.com/embed/${id}` }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      if (id) return { type: 'iframe', src: `https://player.vimeo.com/video/${id}` }
    }
  } catch {
    // URL inválida: se intenta como video directo
  }

  return { type: 'video', src: url }
}
