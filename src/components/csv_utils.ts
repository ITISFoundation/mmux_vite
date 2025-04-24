export async function readCsvData(file: File): Promise<[string[], string[][]]> {
    const csvData = await file.text();
    const rows = csvData.split("\n").map(row => row.split(","));
    const headers = rows[0];
    rows.shift(); // Remove the first row (headers) from the rows list
    if (rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === "") {
        rows.pop(); // Remove the last row if it's an empty line
    }
    return [headers, rows]
}


export async function pickCsv(filePath?: string): Promise<File> {
    if (filePath) {
        const fs = await import('fs');
        const path = await import('path');
        const fileName = path.basename(filePath);
        const fileBuffer = await fs.promises.readFile(filePath);
        return new File([fileBuffer], fileName, { type: "csv" });
    } else {
        let selectedFile: File | null = null;
        console.log("start");
        const inputElement = document.createElement('input');
        inputElement.type = 'file';
        inputElement.accept = '.csv';

        inputElement.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                selectedFile = file;
            } else {
                console.error("No file selected");
                return;
            }
        };

        inputElement.click();

        // Busy-wait until the file is selected
        while (selectedFile === null) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return selectedFile;
    }
}
