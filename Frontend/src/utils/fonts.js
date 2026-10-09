// Loads IBM Plex once (the landing page may already have added it)
export function ensureFonts() {
  const id = 'fina-fonts-app';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(link);
}