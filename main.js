const siteBackground = document.querySelector('.site-background')
const vodafoneToggle = document.querySelector('[data-vodafone-toggle]')

if (siteBackground) {
  const target = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.45,
  }
  const current = { ...target }
  let rafId = 0

  const setBackgroundVars = () => {
    const width = window.innerWidth || 1
    const height = window.innerHeight || 1
    const xNorm = Math.min(Math.max(current.x / width, 0), 1)
    const yNorm = Math.min(Math.max(current.y / height, 0), 1)

    siteBackground.style.setProperty('--mouse-x', `${current.x}px`)
    siteBackground.style.setProperty('--mouse-y', `${current.y}px`)
    siteBackground.style.setProperty('--mouse-x-n', xNorm.toFixed(4))
    siteBackground.style.setProperty('--mouse-y-n', yNorm.toFixed(4))
  }

  const centerPointer = () => {
    target.x = window.innerWidth * 0.5
    target.y = window.innerHeight * 0.45
  }

  const animate = () => {
    current.x += (target.x - current.x) * 0.08
    current.y += (target.y - current.y) * 0.08
    setBackgroundVars()
    rafId = window.requestAnimationFrame(animate)
  }

  const handlePointerMove = (event) => {
    target.x = event.clientX
    target.y = event.clientY
  }

  const handlePointerLeave = () => {
    centerPointer()
  }

  const handleResize = () => {
    centerPointer()
  }

  setBackgroundVars()
  rafId = window.requestAnimationFrame(animate)

  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerleave', handlePointerLeave)
  window.addEventListener('blur', handlePointerLeave)
  window.addEventListener('resize', handleResize)
  window.addEventListener(
    'beforeunload',
    () => {
      window.cancelAnimationFrame(rafId)
    },
    { once: true }
  )
}

if (vodafoneToggle) {
  vodafoneToggle.addEventListener('click', () => {
    const isOpen = vodafoneToggle.classList.toggle('is-open')
    vodafoneToggle.setAttribute('aria-expanded', String(isOpen))
    vodafoneToggle.setAttribute(
      'aria-label',
      isOpen
        ? 'Collapse Vodafone partner label'
        : 'Show Vodafone partner label'
    )
  })
}
