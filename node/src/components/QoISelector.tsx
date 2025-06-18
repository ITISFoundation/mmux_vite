import { useState, useEffect } from "react";
import {
    Box,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import { useMMUXContext } from "../context/MMUXContext";
import SelectQoIDocument from "../components/documents/SelectQoIDocument";
import CustomTooltip from "../components/CustomTooltip";
import { InfoOutline } from "@mui/icons-material";


const QoISelector = () => {
    const {
        outputVars,
        selectedQoI,
        setSelectedQoI,
    } = useMMUXContext();
    const [localQoI, setLocalQoI] = useState<string | undefined>(selectedQoI);
    const handlesetLocalQoI = (value: string) => {
        setLocalQoI(value);
        setSelectedQoI(value);
    };
    useEffect(() => {
        if (outputVars && outputVars.length > 0) {
            setSelectedQoI(outputVars[0]);
        }
    }, [outputVars]);
    return (
        <InputLabel
            size="small"
            sx={{
                display: "flex",
                flex: 1,
                transform: "none",
                alignItems: "baseline",
                gap: "8px",
                fontFamily: "inherit",
                fontWeight: 300,
                fontSize: "1.2em",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center" }}>
                Select Quantity of Interest
                <CustomTooltip
                    title="Choose the simulation output to analyze for uncertainty propagation"
                    ExtendedTootlip={SelectQoIDocument}
                    placement="right"
                    arrow
                >
                    <InfoOutline
                        sx={(theme) => ({
                            color: theme.palette.text.secondary,
                            backgroundColor: theme.palette.grey[100],
                            borderRadius: "50%",
                            padding: "2px",
                            marginLeft: "4px",
                        })}
                    />
                </CustomTooltip>
            </Box>
            <Select
                size="small"
                variant="outlined"
                sx={{ flex: 1, marginTop: "8px" }}
                value={localQoI}
                defaultValue={outputVars?.[0] || ""}
                onChange={(e) => {
                    handlesetLocalQoI(e.target.value);
                }}
            >
                {outputVars?.map((qoi) => (
                    <MenuItem key={qoi} value={qoi}>
                        {qoi}
                    </MenuItem>
                ))}
            </Select>
        </InputLabel>)
}

export default QoISelector;