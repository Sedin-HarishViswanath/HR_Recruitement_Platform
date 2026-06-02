import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Rendering', () => {
  it('should render the App component', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});
