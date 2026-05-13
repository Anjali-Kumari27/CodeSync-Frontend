import React from 'react';
import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

test('renders login page', () => {
  render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );

  expect(
    screen.getByText(/Welcome back!/i)
  ).toBeTruthy();
});