import { useState, useEffect, useCallback } from 'react'

// Desired toolbar order mapped by button title attributes
// We match on the lowercased title text of each Tldraw toolbar button
const DESIRED_TOOLS = [
  'select',       // Selector
  '__palette__',  // Our palette toggle
  'hand',         // Hand/pan  
  'draw',         // Pen
  'eraser',       // Eraser
  'arrow',        // Arrow
  'geo',          // Rectangle/Square (Tldraw calls it "geo")
  'laser',        // Laser
  'highlight',    // Highlighter
]

function getToolId(el: HTMLElement): string {
  // Tldraw uses data-value, title, or aria-label. Try all.
  return (
    el.getAttribute('data-value') ||
    el.getAttribute('data-tool') ||
    el.getAttribute('title')?.toLowerCase().split(' ')[0] ||
    el.id ||
    ''
  )
}

export function StylePanelToggle() {
  const [isVisible, setIsVisible] = useState(false)
  const isVisibleRef = { current: isVisible }
  isVisibleRef.current = isVisible

  const updateStyleSheet = useCallback((visible: boolean) => {
    let styleEl = document.getElementById('style-panel-toggle-css')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'style-panel-toggle-css'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = `
      .tlui-layout__top__right {
        ${visible ? '' : 'display: none !important;'}
        opacity: ${visible ? '1' : '0'} !important;
        transform: translateX(50%) ${visible ? 'translateY(0)' : 'translateY(16px)'} !important;
      }
    `
  }, [])

  useEffect(() => {
    updateStyleSheet(isVisible)
  }, [isVisible, updateStyleSheet])

  useEffect(() => {
    const BUTTON_ID = 'palette-toggle-btn'

    const customizeToolbar = () => {
      const toolsList = document.querySelector('.tlui-toolbar__tools__list')
      if (!toolsList) {
        setTimeout(customizeToolbar, 300)
        return
      }

      // 1. Create palette button if needed
      if (!document.getElementById(BUTTON_ID)) {
        const btn = document.createElement('button')
        btn.id = BUTTON_ID
        btn.className = 'tlui-button tlui-button__tool'
        btn.title = 'Style Panel'
        btn.style.cssText = 'position: relative; flex-shrink: 0; order: 1;'
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:relative;z-index:1;">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
        `
        btn.addEventListener('click', () => {
          const newVal = !isVisibleRef.current
          isVisibleRef.current = newVal
          setIsVisible(newVal)
          btn.setAttribute('aria-checked', newVal ? 'true' : 'false')
        })
        toolsList.appendChild(btn)
      }

      // 2. Log available buttons for debugging (first run only)
      const allButtons = toolsList.querySelectorAll('.tlui-button__tool')
      console.log('[StylePanelToggle] Found toolbar buttons:', 
        Array.from(allButtons).map(b => ({
          title: b.getAttribute('title'),
          id: b.id,
          'data-testid': b.getAttribute('data-testid'),
          'data-value': b.getAttribute('data-value'),
        }))
      )

      // 3. For each button, check if it should be shown
      allButtons.forEach((el) => {
        const htmlEl = el as HTMLElement
        
        // Our custom button
        if (htmlEl.id === BUTTON_ID) {
          htmlEl.style.order = '1'
          return
        }

        const title = (htmlEl.getAttribute('title') || '').toLowerCase()
        
        // Map common title texts to our desired list
        let matched = false
        let order = 99

        for (let i = 0; i < DESIRED_TOOLS.length; i++) {
          const tool = DESIRED_TOOLS[i]
          if (tool === '__palette__') continue
          if (title.includes(tool)) {
            matched = true
            order = i
            break
          }
        }

        if (matched) {
          htmlEl.style.order = String(order)
          htmlEl.style.display = ''
        } else {
          htmlEl.style.display = 'none'
        }
      })
    }

    // Initial run
    customizeToolbar()

    // Keep re-applying in case Tldraw re-renders
    const interval = setInterval(customizeToolbar, 2000)

    return () => {
      clearInterval(interval)
      document.getElementById(BUTTON_ID)?.remove()
      document.getElementById('style-panel-toggle-css')?.remove()
    }
  }, [])

  return null
}
