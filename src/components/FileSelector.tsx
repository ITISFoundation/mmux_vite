import { ChangeEvent } from 'react';

type FileSelectorProps = {
    setFileName: (value: string) => void
}

export default function FileSelector(props: FileSelectorProps) {

    function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
        const target = event.target;
        const file = target.files && target.files[0];
        if (file) {
            props.setFileName(file.name);
        } else {
            // notify user that the file was not retrieved properly
        }
    }

    return (
        < div >
            <input type="file" onChange={handleFileChange} />
        </div >
    );
}