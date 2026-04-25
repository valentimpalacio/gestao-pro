import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LocaleProvider, useLocale } from '../contexts/LocaleContext';

function TestComponent() {
  const { language, changeLanguage, t } = useLocale();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="text">{t('dashboard')}</span>
      <button onClick={() => changeLanguage('en-US')}>Switch</button>
    </div>
  );
}

describe('LocaleContext', () => {
  it('provides default language', () => {
    render(
      <LocaleProvider>
        <TestComponent />
      </LocaleProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('pt-BR');
    expect(screen.getByTestId('text').textContent).toBe('Dashboard');
  });

  it('changes language on button click', () => {
    render(
      <LocaleProvider>
        <TestComponent />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByText('Switch'));
    expect(screen.getByTestId('lang').textContent).toBe('en-US');
  });
});
