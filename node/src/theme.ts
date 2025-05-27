import { createTheme } from "@mui/material";

export function setupTheme(mode: "light" | "dark") {
  const theme = createTheme({
    palette: {
      mode: mode,
      primary: {
        main: mode === "light" ? "#FF7C60" : "#FF8166",
        contrastText: mode === "light" ? "#000" : "#fff",
      },
      secondary: {
        main: mode === "light" ? "#FFBEB0" : "#FF886F",
        contrastText: mode === "light" ? "#222" : "#222",
      },
      text: {
        primary: mode === "light" ? "#222" : "#eee",
        secondary: mode === "light" ? "#555" : "#ccc",
      },
      background: {
        default: mode === "light" ? "#fff" : "#07161d",
        paper: mode === "light" ? "#eee" : "#555",
      },
      divider: mode === "light" ? "#bbb" : "#999",
    }
  });

  return createTheme(theme, {
    // shape: { borderRadius: 10 }
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "light" ? "#ddd" : "#343839",
            variants: [
              {
                props: {
                  variant: "contained",
                },
              },
            ],
            "&:hover": {
              backgroundColor: mode === "light" ? "#fff" : "#444",
            },
            "&:disabled": {
              color: mode === "light" ? "#999" : "#888",
              backgroundColor: mode === "light" ? "#bbb" : "#666",
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "light" ? "#ddd" : "#343839",
            variants: [
              {
                props: {
                  variant: "contained",
                },
              },
            ],
            "&:hover": {
              backgroundColor: mode === "light" ? "#fff" : "#444",
            },
            "&:disabled": {
              color: mode === "light" ? "#999" : "#777",
              backgroundColor: mode === "light" ? "#bbb" : "#555",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            backgroundColor: theme.palette.background.default,
          },
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          iconContainer: {
            color: mode === "light" ? "#333" : "#eee",
            "&.Mui-active": {
              color: theme.palette.primary.main,
            },
            "&.Mui-completed": {
              color: mode === "light" ? "#4CAF50" : "#FF8166",
            },
          },
          label: {
            color: mode === "light" ? "#333" : "#eee",
          },
        },
      },
    },
  });
}
