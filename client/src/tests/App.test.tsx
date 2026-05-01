import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Providers } from '../app/providers';
import { Router } from '../app/router';

describe('App Rendering', () => {
  it('should render the main title', () => {
    render(
      <Providers>
        <Router />
      </Providers>
    );
    expect(screen.getByText(/HR Recruitment Platform/i)).toBeInTheDocument();
  });
});
