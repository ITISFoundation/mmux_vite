import { createTheme } from "@mui/material";

export function setupTheme(mode: "light" | "dark") {
  const theme = createTheme({
    palette: {
      mode: mode,
      primary: {
        main: mode === "light" ? "#5dc0ff" : "#00639f",
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
      grey: {
        100: mode === "light" ? "#f5f5f5" : "#343839",
        200: mode === "light" ? "#e0e0e0" : "#444",
        300: mode === "light" ? "#cfcfcf" : "#555",
        400: mode === "light" ? "#bdbdbd" : "#666",
        500: mode === "light" ? "#9e9e9e" : "#777",
        600: mode === "light" ? "#757575" : "#888",
        700: mode === "light" ? "#616161" : "#999",
        800: mode === "light" ? "#424242" : "#aaa",
        900: mode === "light" ? "#212121" : "#bbb",
      },
    }
  });

  return createTheme(theme, {
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            backgroundColor: theme.palette.grey[100],
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
            backgroundColor: theme.palette.grey[100],
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
              color: theme.palette.grey[500],
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
