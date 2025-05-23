import { createTheme } from "@mui/material";

export function setupTheme() {
    return createTheme({
        // shape: { borderRadius: 10 }
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        color: '#eee', // almost white text in buttons
                        backgroundColor: '#343839',
                        variants: [{
                            props: {
                                variant: "contained",
                            },
                            style: {
                                // backgroundColor works but disableElevation doesn't...
                                // disableElevation: true,
                                // disableRipple: true,
                                // backgroundColor : "red",
                                // boxShadow: "200px",
                            }
                        }
                        ],
                        '&:hover': {
                            backgroundColor: '#0090D0', /* S4L blue */
                        },
                        '&:disabled': {
                            color: '#555',
                            backgroundColor: 'transparent',
                            border: '1px solid #555',
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                      backgroundColor: 'transparent',
                    }
                }
            }
        },
    });
}