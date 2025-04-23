import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FunctionIndex from '../../components/FunctionIndex';

describe('FunctionIndex Component', () => {
    it('renders without crashing', () => {
        render(<FunctionIndex />);
    });
});
