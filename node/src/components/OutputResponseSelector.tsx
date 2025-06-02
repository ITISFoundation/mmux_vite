import React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

type OutputResponseSelectorProps = {
    selectedResponse: string | number;
    setSelectedResponse: (arg0: string | number) => void;
    responses: (string | number)[];
    isLogEnabled: boolean | undefined;
    setIsLogEnabled: (arg0: boolean) => void;
};

export default function OutputResponseSelector(props: OutputResponseSelectorProps) {
    return (

        <div style={{ display: "flex", flexDirection: "row" }}>
            <h3 style={{ justifyContent: 'left' }}>Surrogate Model Analysis and Validation</h3>
            <FormControl style={{ width: '200px', height: "100px", justifyContent: 'right' }}>
                <InputLabel style={{ justifyContent: 'right' }} >Output QoI : </InputLabel>
                <Select
                    value={props.selectedResponse}
                    onChange={(e) => props.setSelectedResponse(e.target.value)}
                >
                    {props.responses
                        .filter(
                            (response): response is string | number =>
                                typeof response === "string" || typeof response === "number"
                        )
                        .map((response, index) => (
                            <MenuItem key={index} value={response}>
                                {response}
                            </MenuItem>
                        ))}
                </Select>
            </FormControl>
            <label>
                <input
                    type="checkbox"
                    checked={props.isLogEnabled}
                    onChange={() => props.setIsLogEnabled(!props.isLogEnabled)}
                />
                Log (inputs & output)
            </label>
        </div >
    );
};

