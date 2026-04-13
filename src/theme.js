import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#ff9800", // vastu-friendly saffron 😄
    },
    secondary: {
      main: "#795548",
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: "#ffffff",
          textTransform: "none",
        },
        contained: {
          color: "#ffffff",
        },
        outlined: {
          color: "#ffffff",
          borderColor: "rgba(255, 255, 255, 0.5)",
          "&:hover": {
            borderColor: "#ffffff",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
        text: {
          color: "#ffffff",
        },
      },
    },
  },
});

export default theme;
