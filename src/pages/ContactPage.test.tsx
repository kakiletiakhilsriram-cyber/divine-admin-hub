import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import ContactPage from './ContactPage';

const { invoke, errorToast } = vi.hoisted(() => ({
  invoke: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));
vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: errorToast } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('crypto', { randomUUID: () => '12345678-1234-4234-8234-123456789abc' });
  invoke.mockResolvedValue({ data: { received: true, reference: '12345678-1234-4234-8234-123456789abc' }, error: null });
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function completeRequiredFields() {
  fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test visitor' } });
  fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'visitor@example.com' } });
  fireEvent.change(screen.getByLabelText('Subject *'), { target: { value: 'Visit timings' } });
  fireEvent.change(screen.getByLabelText('Message *'), { target: { value: 'Please confirm opening hours.' } });
}

describe('contact phone input', () => {
  it('keeps phone optional and stores an omitted phone as null', async () => {
    render(<ContactPage />);
    completeRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith('submit-contact', {
      body: expect.objectContaining({ phone: null, request_id: '12345678-1234-4234-8234-123456789abc' }),
    }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('12345678-1234-4234-8234-123456789abc'));
  });

  it('ignores letters, spaces and symbols in changed or pasted input', () => {
    render(<ContactPage />);
    const phone = screen.getByLabelText('Phone (optional)');
    fireEvent.change(phone, { target: { value: 'abc+91 0987-x' } });
    expect(phone).toHaveValue('910987');
    expect(phone).toHaveAttribute('inputmode', 'numeric');
    expect(phone).not.toBeRequired();
  });

  it('preserves leading zeroes and submits the phone as a string', async () => {
    render(<ContactPage />);
    completeRequiredFields();
    fireEvent.change(screen.getByLabelText('Phone (optional)'), { target: { value: '0123456789' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith('submit-contact', {
      body: expect.objectContaining({ phone: '0123456789' }),
    }));
  });

  it.each(['123', '12345678901'])('rejects a provided phone with invalid length: %s', (value) => {
    render(<ContactPage />);
    completeRequiredFields();
    fireEvent.change(screen.getByLabelText('Phone (optional)'), { target: { value } });
    const form = screen.getByRole('button', { name: 'Send Message' }).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    expect(invoke).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledWith('Enter a 10-digit phone number, or leave it blank');
  });

  it('preserves the enquiry and phone when the database rejects submission', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'Unavailable' } });
    render(<ContactPage />);
    completeRequiredFields();
    fireEvent.change(screen.getByLabelText('Phone (optional)'), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
    await waitFor(() => expect(errorToast).toHaveBeenCalled());
    expect(screen.getByLabelText('Phone (optional)')).toHaveValue('9876543210');
    expect(screen.getByLabelText('Message *')).toHaveValue('Please confirm opening hours.');
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeEnabled();
  });

  it('preserves the same reference when a connection failure is retried', async () => {
    invoke.mockRejectedValueOnce(new Error('Network unavailable'));
    render(<ContactPage />);
    completeRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
    await waitFor(() => expect(errorToast).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));
    expect(invoke.mock.calls[0][1].body.request_id).toBe(invoke.mock.calls[1][1].body.request_id);
  });
});
