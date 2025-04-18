import { useState } from 'react';
const options = ['Gaussian Process (Surfpack)', 'MLP'];

export default function SuMoTypeSelector() {
    const [selected, setSelected] = useState(0);

    const toggleOption = () => {
        setSelected(selected === options.length - 1 ? 0 : selected + 1);
    };

    return (
        <div>
            <button onClick={toggleOption}>
                SuMo type
            </button>
            {" : " + options[selected]}
        </div>
    );
}