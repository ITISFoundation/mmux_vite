import { useContext, useEffect, useState } from 'react';
import MMUXContext from '../views/MMUXContext';
import usePersistentJSONState from '../hooks/usePersistentJSONState';
import { Button, Input } from '@mui/material';


function runGridSearchSampling(config: unknown[]) {
    console.log("Grid Search Sampling not implemented yet!", config)
}


function GridSearchSampling() {
    const context = useContext(MMUXContext);
    let [gridSearchInputs, setGridSearchInputs] = [] as unknown as [PersistentState[], (state: PersistentState[]) => void];
    const [JSONStateFilePath, setJSONStateFilePath] = useState("");

    // TODO: Review this calls and apply the try/catch pattern to all API calls that can fail, this can even be moved to the setJSONStateFilePath function
    try {
      // TODO: FIX TS ERRRORS
      // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'never[]'.
      const inputVars = context?.selectedFunction?.inputSchema.required as string[];
      // Needed to move the filePath outside of the PersistentJSONState hook to avoid triggering infinite loops
      // Now it works and I have persistence even across sessions :)

      [gridSearchInputs, setGridSearchInputs] = usePersistentJSONState<PersistentState[]>({
          defaultState: inputVars?.map((inputVar) => ({
              variable: inputVar,
              start: 0.0,
              end: 1.0,
              points: 10,
          })),
          filePath: JSONStateFilePath
      });
    } catch (error) {
      console.warn("Error in GridSearchSampling: ", error);
    }

    useEffect(() => {
        if (context?.selectedFunction) {
            // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'never[]'.
            const funname = context?.selectedFunction?.name?.replace(/\s+/g, "_");
            setJSONStateFilePath(`src/assets/gridSearchInputs_${funname}.json`);
        }
    }, [context?.selectedFunction]);


    function handleInputChange(index: number, field: string, value: string) {
        setGridSearchInputs((prevInputs: PersistentState[]) => {
            const newInputs = [...prevInputs];
            newInputs[index] = {
                ...newInputs[index],
                [field]: field === "points" ? parseInt(value) : parseFloat(value),
            };
            return newInputs;
        });
    }

    return (
        <>
            <h4>Grid Search Sampling</h4>
            <p>Specify the ranges and number of points per dimension for the grid search sampling.</p>
            {gridSearchInputs?.map((inputVar, index) => (
                <form key={index} style={{ display: "flex", alignItems: "center", marginBottom: "20px", gap: "20px", }}>
                    <h5 style={{ marginLeft: 10, marginRight: 20, marginBottom: 0, marginTop: 0, fontSize: 18 }}>{inputVar.variable}</h5>
                    <span>Start: </span>
                    <Input
                        type="number"
                        placeholder="Start"
                        value={inputVar.start.toString()}
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "start", e.target.value)}
                    />
                    <span>End: </span>
                    <Input
                        type="number"
                        placeholder="End"
                        value={inputVar.end.toString()}
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "end", e.target.value)}
                    />
                    <span>Number of points: </span>
                    <Input
                        type="number"
                        placeholder="Points"
                        value={inputVar.points.toString()}
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "points", e.target.value)}
                    />
                </form>
            ))}

            <Button onClick={() => runGridSearchSampling(gridSearchInputs)}>Run Grid Search Sampling</Button>
        </>
    );
}


export default GridSearchSampling;