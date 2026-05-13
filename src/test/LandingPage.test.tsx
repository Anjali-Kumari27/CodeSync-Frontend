import React from 'react';
import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

test('renders landing page', () => {
  render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  );

  expect(
    screen.getByText(/The Collaborative/i)
  ).toBeTruthy();
});
