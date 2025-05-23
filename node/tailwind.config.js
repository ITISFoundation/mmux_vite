/** @type {import('tailwindcss').Config} */
export default {
  // content: [
  //   "./index.html",
  //   "./src/*.{js,ts,jsx,tsx,html}",
  //   "./src/**/*.{js,ts,jsx,tsx,html}",
  // ],
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'], // Include all relevant files
  theme: {
    extend: {
      // animation: {
      //   'progress-mac': 'progress-mac 2s linear infinite',
      // },
    },
  },
  plugins: [],
}
