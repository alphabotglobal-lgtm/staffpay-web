/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#4ADE80',
                dark: {
                    900: '#0a0a0a',
                    800: '#141414',
                    700: '#1a1a1a',
                    600: '#242424',
                },
                obsidian: '#050505',
                charcoal: '#121212',
                gold: '#FACC15',
                chrome: '#94A3B8',
                ivory: '#FAFAFA',
                silver: '#F4F4F5',
                platinum: '#E4E4E7',
                slate: {
                    800: '#1e293b',
                    900: '#0f172a',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                drama: ['"Playfair Display"', 'serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
        },
    },
    plugins: [],
}
