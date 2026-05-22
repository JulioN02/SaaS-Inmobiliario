/* =============================================================================
   SaaS Inmobiliario — FeeStatusTabs Tests
   ============================================================================= */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeeStatusTabs } from '../components/FeeStatusTabs';

describe('FeeStatusTabs', () => {
  it('renders 4 tab buttons: Todas, Pendientes, Pagadas, Parciales', () => {
    const onFilterChange = vi.fn();
    render(<FeeStatusTabs filterStatus={undefined} onFilterChange={onFilterChange} />);

    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Pagadas')).toBeInTheDocument();
    expect(screen.getByText('Parciales')).toBeInTheDocument();
  });

  it('highlights the active tab when filterStatus is undefined (Todas)', () => {
    const onFilterChange = vi.fn();
    render(<FeeStatusTabs filterStatus={undefined} onFilterChange={onFilterChange} />);

    const todasButton = screen.getByText('Todas');
    // The active tab has both "tab" and "tabActive" classes in its className
    expect(todasButton.className).toContain('tabActive');
  });

  it('highlights the Pendientes tab when filterStatus is PENDING', () => {
    const onFilterChange = vi.fn();
    render(<FeeStatusTabs filterStatus="PENDING" onFilterChange={onFilterChange} />);

    const pendientesButton = screen.getByText('Pendientes');
    expect(pendientesButton.className).toContain('tabActive');

    const todasButton = screen.getByText('Todas');
    expect(todasButton.className).not.toContain('tabActive');
  });

  it('highlights the Pagadas tab when filterStatus is PAID', () => {
    const onFilterChange = vi.fn();
    render(<FeeStatusTabs filterStatus="PAID" onFilterChange={onFilterChange} />);

    const pagadasButton = screen.getByText('Pagadas');
    expect(pagadasButton.className).toContain('tabActive');
  });

  it('highlights the Parciales tab when filterStatus is PARTIAL', () => {
    const onFilterChange = vi.fn();
    render(<FeeStatusTabs filterStatus="PARTIAL" onFilterChange={onFilterChange} />);

    const parcialesButton = screen.getByText('Parciales');
    expect(parcialesButton.className).toContain('tabActive');
  });

  it('calls onFilterChange with correct status when a tab is clicked', () => {
    const onFilterChange = vi.fn();
    render(<FeeStatusTabs filterStatus={undefined} onFilterChange={onFilterChange} />);

    fireEvent.click(screen.getByText('Pendientes'));
    expect(onFilterChange).toHaveBeenCalledWith('PENDING');

    fireEvent.click(screen.getByText('Pagadas'));
    expect(onFilterChange).toHaveBeenCalledWith('PAID');

    fireEvent.click(screen.getByText('Parciales'));
    expect(onFilterChange).toHaveBeenCalledWith('PARTIAL');
  });

  it('calls onFilterChange with undefined when Todas is clicked', () => {
    const onFilterChange = vi.fn();
    render(<FeeStatusTabs filterStatus="PENDING" onFilterChange={onFilterChange} />);

    fireEvent.click(screen.getByText('Todas'));
    expect(onFilterChange).toHaveBeenCalledWith(undefined);
  });

  it('only one tab has the active class at a time', () => {
    const onFilterChange = vi.fn();
    render(<FeeStatusTabs filterStatus="PAID" onFilterChange={onFilterChange} />);

    const buttons = screen.getAllByRole('button');
    const activeButtons = buttons.filter((btn) => btn.className.includes('tabActive'));
    expect(activeButtons.length).toBe(1);
  });
});
