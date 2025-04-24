import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { pickCsv } from '../../components/csv_utils';
import { FunctionIndex } from '../../components/FunctionIndex';
const fs = await import('fs');
const path = await import('path');
const filePath = path.resolve(__dirname, '../../assets/results_Final_50LHS_TitrationProcessed.csv');

describe('FunctionIndex Component', () => {
    it('renders without crashing', () => {
        render(<FunctionIndex />);
    });
});

describe('pickCsv', () => {
    it('should handle a fixed path to a CSV file', async () => {
        console.log("File: ", filePath)
        // Call the function
        const file = await pickCsv(filePath);

        // Assertions
        expect(file).toBeDefined();
        expect(file.name).toBe(path.basename(filePath));

        // Check if the file exists and can be read
        expect(fs.existsSync(filePath)).toBe(true);
    });
});

