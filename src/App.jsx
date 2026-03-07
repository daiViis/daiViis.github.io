import React, { useState } from 'react'

const profile = {
  name: 'David Cit',
  eyebrow: 'Business Consultant + Product Design',
  headline:
    'Web and digital application design and development focused on transforming ideas into functional, scalable products. Business advisory in partnership with Vodafone, helping clients select and implement effective connectivity and communication solutions.',
  specialties: [
    'Context Engineering',
    'Prompt Engineering',
    'App Design',
    'LLM Workflows',
    'Digital Product Thinking',
  ],
}

function App() {
  const [isVodafoneOpen, setIsVodafoneOpen] = useState(false)

  return (
    <div className="site-shell">
      <div className="site-noise" aria-hidden="true" />

      <main>
        <section className="hero" id="home">
          <div className="hero-backdrop" aria-hidden="true">
            <span>DAVID</span>
            <span>CIT</span>
          </div>

          <div className="hero-copy">
            <p className="eyebrow">{profile.eyebrow}</p>
            <h1>{profile.name}</h1>
            <p className="headline">{profile.headline}</p>

            <div className="hero-actions">
              <a
                className="button button-primary button-main-link"
                href="https://daiviis.dev/"
                target="_blank"
                rel="noreferrer"
              >
                Visit daiviis.dev
              </a>
              <button
                type="button"
                className={`vodafone-toggle${isVodafoneOpen ? ' is-open' : ''}`}
                aria-expanded={isVodafoneOpen}
                aria-label={
                  isVodafoneOpen
                    ? 'Collapse Vodafone partner label'
                    : 'Show Vodafone partner label'
                }
                onClick={() => setIsVodafoneOpen((open) => !open)}
              >
                <span className="vodafone-toggle-icon" aria-hidden="true">
                  <img
                    src="/vodafone-partner-mark.png"
                    alt=""
                  />
                </span>
                <span className="vodafone-toggle-text">
                  Vodafone CZ Door To Door Partner
                </span>
              </button>
            </div>

            <div className="hero-contact" aria-label="Direct contact">
              <a className="hero-contact-item" href="tel:+420776523070">
                <span className="hero-contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7.5 4.5h2.4l1.2 3.6-1.5 1.5a14 14 0 0 0 4.8 4.8l1.5-1.5 3.6 1.2v2.4c0 .5-.4.9-.9.9C10 18.9 5.1 14 5.1 5.4c0-.5.4-.9.9-.9Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>+420 776 523 070</span>
              </a>
              <a
                className="hero-contact-item"
                href="mailto:david.cit1999@gmail.com"
              >
                <span className="hero-contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4.5 7.5h15a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15V9a1.5 1.5 0 0 1 1.5-1.5Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="m4 8 8 5 8-5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>
                david.cit1999@gmail.com
                </span>
              </a>
              <a
                className="hero-contact-item"
                href="mailto:david.cit1@vodafone.com"
              >
                <span className="hero-contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4.5 7.5h15a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15V9a1.5 1.5 0 0 1 1.5-1.5Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="m4 8 8 5 8-5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>david.cit1@vodafone.com</span>
              </a>
            </div>

            <div className="hero-socials" aria-label="Social links">
              <a
                className="social-button"
                href="https://www.instagram.com/cit.david/"
                target="_blank"
                rel="noreferrer"
              >
                <span className="social-button-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect
                      x="4.5"
                      y="4.5"
                      width="15"
                      height="15"
                      rx="4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle cx="16.7" cy="7.4" r="1" fill="currentColor" />
                  </svg>
                </span>
                <span>Instagram</span>
              </a>
              <a
                className="social-button"
                href="https://github.com/daiViis/"
                target="_blank"
                rel="noreferrer"
              >
                <span className="social-button-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3.75a8.25 8.25 0 0 0-2.61 16.08c.4.08.54-.17.54-.38v-1.47c-2.2.48-2.67-.93-2.67-.93-.36-.9-.88-1.14-.88-1.14-.72-.5.05-.49.05-.49.8.06 1.22.82 1.22.82.7 1.2 1.84.86 2.29.66.07-.52.28-.86.5-1.06-1.75-.2-3.6-.88-3.6-3.94 0-.87.31-1.59.82-2.15-.08-.2-.35-1 .08-2.08 0 0 .67-.22 2.2.82a7.5 7.5 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.43 1.08.16 1.88.08 2.08.51.56.82 1.28.82 2.15 0 3.07-1.85 3.74-3.62 3.94.29.25.54.74.54 1.5v2.22c0 .21.14.46.55.38A8.25 8.25 0 0 0 12 3.75Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>GitHub</span>
              </a>
              <a
                className="social-button"
                href="https://discord.com/users/723960517227446323"
                target="_blank"
                rel="noreferrer"
              >
                <span className="social-button-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8.4 8.9a11 11 0 0 1 1.92-.6l.23.46a10.1 10.1 0 0 1 2.9 0l.23-.46c.66.11 1.31.31 1.92.6.95 1.4 1.5 3.06 1.57 4.77a7.7 7.7 0 0 1-2.35 1.2l-.5-.82c.39-.14.77-.32 1.12-.55-.1-.07-.2-.15-.29-.23a8.4 8.4 0 0 1-6.3 0 3 3 0 0 1-.3.23c.35.22.73.4 1.13.55l-.5.82a7.7 7.7 0 0 1-2.35-1.2c.07-1.7.62-3.36 1.57-4.77Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <circle cx="10" cy="12.2" r="1" fill="currentColor" />
                    <circle cx="14" cy="12.2" r="1" fill="currentColor" />
                  </svg>
                </span>
                <span>Discord</span>
              </a>
            </div>
          </div>

          <div className="hero-portrait-wrap">
            <div className="portrait-stage">
              <div className="portrait-panel">
                <img
                  className="portrait-image"
                  src="/david-cit-profile.png"
                  alt="Portrait of David Cit"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
