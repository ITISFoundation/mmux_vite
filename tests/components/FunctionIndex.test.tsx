import { describe, it, expect } from 'vitest';
import { pickCsv } from '../../src/components/csv_utils';
import { FUNCTION_API } from '../../src/components/api_objects';
import { registerCsvAsFunction, registerCsvValuesAsFunctionJobs } from '../../src/components/FunctionIndex';
import fs from 'fs';
import path from 'path';

const filePath = path.resolve(__dirname, '../../src/assets/results_Final_50LHS_TitrationProcessed.csv');

describe('Register CSV Integration Test', () => {
    it('should check if the Functions API is available', async () => {
        const functions = await FUNCTION_API.listFunctions();
        expect(functions).toBeDefined();
        expect(Array.isArray(functions)).toBe(true);
    });

    it('full Integration test', async () => {
        // Ensure the file exists
        const filePath = path.resolve(__dirname, '../../src/assets/results_Final_50LHS_TitrationProcessed.csv');
        expect(fs.existsSync(filePath)).toBe(true);

        const file = await pickCsv(filePath);
        expect(file).toBeDefined();
        expect(file.name).toBe(path.basename(filePath));
        console.log("Picked CSV")

        await FUNCTION_API.deleteAllFunctions()
        const fun = await registerCsvAsFunction(file);
        expect(fun).toBeDefined();
        expect(fun.name).toBe(file.name);
        console.log("Registered CSV as Function")

        const jobs = await registerCsvValuesAsFunctionJobs(fun, file);
        expect(jobs).toBeDefined();
        expect(Array.isArray(jobs)).toBe(true);
        expect(jobs.length).toBeGreaterThan(0);
        console.log("Registered CSV rows as FunctionJobs")

        const firstJob = jobs[0];
        expect(firstJob).toBeDefined();
        console.log(firstJob)
        expect(firstJob.functionID).toBe(fun.id);
        expect(firstJob.status).toBe('COMPLETED');
        console.log("FunctionJobs are correctly registered")
    });

    it('should handle errors when registering a CSV file as a function', async () => {
        const invalidFilePath = path.resolve(__dirname, '../../src/assets/nonexistent.csv');
        expect(fs.existsSync(invalidFilePath)).toBe(false);

        try {
            const file = await pickCsv(invalidFilePath);
            await registerCsvAsFunction(file, "Invalid Function");
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.message).toContain('no such file or directory');
        }
    });

    // it('should validate job input and output schemas', async () => {
    //     const file = await pickCsv(filePath);
    //     const fun = await registerCsvAsFunction(file);
    //     const jobs = await registerCsvValuesAsFunctionJobs(fun, file)
    // });
});
