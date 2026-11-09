/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                pony: {
                    bg: '#f8fafc',
                    card: '#ffffff',
                    text: '#1e293b',
                    muted: '#64748b',
                    accent: '#059669',
                    accentHover: '#047857',
                }
            }
        },
    },
    plugins: [],
}