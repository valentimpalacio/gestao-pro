import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '../components/StatCard';

describe('StatCard', () => {
  it('renders title and value correctly', () => {
    render(
      <StatCard
        title="Total Sales"
        value="R$ 1.000"
        icon={<span data-testid="icon">Icon</span>}
      />
    );

    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.000')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(
      <StatCard
        title="Revenue"
        value="R$ 5.000"
        trend={{ value: 10, label: 'vs last month' }}
        icon={<span>Icon</span>}
      />
    );

    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/vs last month/)).toBeInTheDocument();
  });
});
