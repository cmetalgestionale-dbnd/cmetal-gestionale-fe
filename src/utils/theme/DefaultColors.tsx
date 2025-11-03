import { createTheme } from "@mui/material/styles";
import { Plus_Jakarta_Sans } from "next/font/google";

export const plus = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

const darkTheme = createTheme({
  direction: "ltr",
  palette: {
    mode: "dark",
    primary: {
      main: "#FF4C4C",
      light: "#FF6666",
      dark: "#D93B3B",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#FF6F61",
      light: "#FF8A75",
      dark: "#C94B42",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#13DEB9",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#FF8C42",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#E53935",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#FFB300",
      contrastText: "#000000",
    },
    grey: {
      100: "#1E1E2F",
      200: "#25263A",
      300: "#2F3147",
      400: "#3B3D55",
      500: "#7C8FAC",
      600: "#A3AEC6",
    },
    text: {
      primary: "#FFFFFF", // più bianco per sidebar
      secondary: "#C8CCD6", // grigio chiaro per testi secondari
    },
    background: {
      default: "#0D0E12",
      paper: "#1A1B26", // leggermente più chiaro, ottimo per sidebar
    },
    divider: "rgba(255, 255, 255, 0.12)",
  },

  typography: {
    fontFamily: plus.style.fontFamily,
    h1: { fontWeight: 600, fontSize: "2.25rem", lineHeight: "2.75rem" },
    h2: { fontWeight: 600, fontSize: "1.875rem", lineHeight: "2.25rem" },
    h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: "1.75rem" },
    h4: { fontWeight: 600, fontSize: "1.3125rem", lineHeight: "1.6rem" },
    h5: { fontWeight: 600, fontSize: "1.125rem", lineHeight: "1.6rem" },
    h6: { fontWeight: 600, fontSize: "1rem", lineHeight: "1.2rem" },
    button: { textTransform: "capitalize", fontWeight: 400 },
    body1: { fontSize: "0.875rem", fontWeight: 400, lineHeight: "1.334rem" },
    body2: { fontSize: "0.75rem", fontWeight: 400, lineHeight: "1rem" },
  },
});

export { darkTheme as baselightTheme };
