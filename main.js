const vodafoneToggle = document.querySelector('[data-vodafone-toggle]')

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
