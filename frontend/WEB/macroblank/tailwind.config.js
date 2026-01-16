/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        sidebar: 'var(--sidebar-bg)',
        'sidebar-border': 'var(--sidebar-border)',
        card: 'var(--card-bg)',
        primary: 'var(--primary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
    },
  },
  plugins: [],
}
