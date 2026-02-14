/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['selector', '.tl-theme__dark'],
    content: [
        './src/renderer/index.html',
        './src/renderer/src/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
