import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock axios to avoid import issues
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
}));

test('renders user management app', () => {
  render(<App />);
  const element = screen.getByText(/User Management App/i);
  expect(element).toBeInTheDocument();
});

test('renders add user form', () => {
  render(<App />);
  const element = screen.getByText(/Add New User/i);
  expect(element).toBeInTheDocument();
});

test('app component exists', () => {
  expect(App).toBeDefined();
});
