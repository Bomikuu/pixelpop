export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pp: {
          bg: "var(--pp-bg)",
          window: "var(--pp-window)",
          border: "var(--pp-border)",
          accent: "var(--pp-accent)",
          accent2: "var(--pp-accent-2)",
          title: "var(--pp-titlebar)",
        },
      },
      boxShadow: {
        pp: "var(--pp-shadow)",
        ppSoft: "var(--pp-shadow-soft)",
      },
      fontFamily: {
        pp: "var(--pp-font)",
      },
    },
  },
  plugins: [],
};
