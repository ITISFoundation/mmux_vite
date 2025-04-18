import { createTheme } from "@mui/material";
import { deepPurple } from '@mui/material/colors';

export function setupTheme() {
    return createTheme({
        palette: { primary: deepPurple },
        // shape: { borderRadius: 10 }
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        variants: [{
                            props: {
                                variant: "contained",
                            },
                            style: {
                                // backgroundColor works but disableElevation doesnt...
                                // disableElevation: true,
                                // disableRipple: true,
                                // backgroundColor : "red",
                                // boxShadow: "200px",
                                
                            }
                        }
                        ],
                        '&:hover': {
                            backgroundColor: deepPurple[300], // Slightly darker on hover
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        variants: [
                            {
                                props: {variant: "plain"},
                                style: {}
                            }
                        ]
                    }
                }
            }
        },
    });
}