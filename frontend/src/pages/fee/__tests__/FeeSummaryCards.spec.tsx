/* =============================================================================
   SaaS Inmobiliario — FeeSummaryCards Tests
   ============================================================================= */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeeSummaryCards } from '../components/FeeSummaryCards';

describe('FeeSummaryCards', () => {
  const summary = {
    total: 1_250_000,
    pending: 500_000,
    paid: 450_000,
    partial: 300_000,
  };

  it('renders 4 summary cards with correct titles', () => {
    render(<FeeSummaryCards summary={summary} />);
    expect(screen.getByText('Total Cuotas')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('Parcial')).toBeInTheDocument();
  });

  it('renders formatted currency values using es-CO locale', () => {
    render(<FeeSummaryCards summary={summary} />);
    // 1.250.000 → es-CO format
    expect(screen.getByText(/\$1\.250\.000/)).toBeInTheDocument();
    expect(screen.getByText(/\$500\.000/)).toBeInTheDocument();
    expect(screen.getByText(/\$450\.000/)).toBeInTheDocument();
    expect(screen.getByText(/\$300\.000/)).toBeInTheDocument();
  });

  it('shows zero values correctly', () => {
    const zeroSummary = { total: 0, pending: 0, paid: 0, partial: 0 };
    render(<FeeSummaryCards summary={zeroSummary} />);
    // $0 in es-CO locale
    const valueElements = screen.getAllByText(/\$0/);
    expect(valueElements.length).toBeGreaterThanOrEqual(4);
  });

  it('renders all values inside the document', () => {
    const { container } = render(<FeeSummaryCards summary={summary} />);
    // Each card is inside a div with role generic / as a div
    const cardValues = container.querySelectorAll('[class*="summaryCardValue"]');
    expect(cardValues.length).toBe(4);
  });
});
