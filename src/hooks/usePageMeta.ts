import { useEffect } from 'react'

function setMeta(selector: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

export default function usePageMeta(title: string, description?: string): void {
  useEffect(() => {
    document.title = title
    setMeta('meta[name="description"]', description ?? '')
    setMeta('meta[property="og:title"]', title)
    setMeta('meta[property="og:description"]', description ?? '')
    setMeta('meta[property="og:type"]', 'website')
  }, [title, description])
}