import { PYTHON_DAKOTA_BACKEND } from '../components/api_objects';

async function saveJSONState(state: any, filePath: string) {
    fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/save_json',
        {
            method: "POST",
            body: JSON.stringify(
                {
                    filePath: filePath,
                    data: state,
                }
            ),
        }).then(function (response) {
            return response.json()
        }).then(function (data) {
            console.log("Saved gridSearchInputs.json successfully", data);
        }).catch(function (error) {
            console.error("Error saving gridSearchInputs.json", error);
        }
                )       
}

async function loadJSONState(filePath: string): Promise<any> {
    return await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/load_json' + "?filePath=" + filePath,
    ).then(function (response) {
        return response.json()
    }).then(function (data) {
        console.log("Loaded ", filePath, " successfully", data);
        return data
    }).catch(function (error) {
        console.error("Error loading ", filePath, ": ", error);
    }
    )
}

export { saveJSONState, loadJSONState };