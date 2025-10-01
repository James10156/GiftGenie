import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FriendForm } from './FriendForm';
import type { Friend } from '@shared/schema';

type FriendFormProps = {
  friend?: Friend;
  onClose: () => void;
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const renderFriendForm = (props: Partial<FriendFormProps> = {}) => {
  const Wrapper = createWrapper();
  const onClose = props.onClose ?? vi.fn();
  render(
    <Wrapper>
      <FriendForm onClose={onClose} friend={props.friend} />
    </Wrapper>
  );
  return { user: userEvent.setup(), onClose };
};

const getCurrentStep = () => {
  const indicator = screen.getByText(/Step \d of 5/i);
  const match = indicator.textContent?.match(/Step\s+(\d)\s+of\s+5/i);
  return match ? Number(match[1]) : 1;
};

const advanceToStep = async (user: ReturnType<typeof userEvent.setup>, step: number) => {
  while (getCurrentStep() < step) {
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
  }
};

describe('FriendForm', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders initial form state for a new friend', () => {
    renderFriendForm();

    expect(screen.getByLabelText(/friend's name/i)).toHaveValue('');
    expect(screen.getByLabelText(/country/i)).toHaveDisplayValue('United Kingdom');
    expect(screen.getByLabelText(/currency/i)).toHaveDisplayValue('GBP');
    expect(screen.getByLabelText(/budget/i)).toHaveValue(null);
  });

  it('pre-fills the form when editing an existing friend', async () => {
    const existingFriend: Friend = {
      id: 'friend-1',
      name: 'John Doe',
      personalityTraits: ['Funny', 'Creative'],
      interests: ['Gaming', 'Music'],
      budget: 100,
      currency: 'USD',
      country: 'United States',
      notes: 'Best friend',
      createdAt: new Date().toISOString(),
      userId: 'user-1',
    };

    const { user } = renderFriendForm({ friend: existingFriend });

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('United States')).toBeInTheDocument();
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    await advanceToStep(user, 5);
    expect(screen.getByDisplayValue('Best friend')).toBeInTheDocument();
  });

  it('allows updating basic information', async () => {
    const { user } = renderFriendForm();

    const nameInput = screen.getByLabelText(/friend's name/i);
    await user.type(nameInput, 'Jane Smith');

    const countrySelect = screen.getByLabelText(/country/i);
    await user.selectOptions(countrySelect, 'United States');

    const currencySelect = screen.getByLabelText(/currency/i);
    await user.selectOptions(currencySelect, 'USD');

    const budgetInput = screen.getByLabelText(/budget/i);
    await user.clear(budgetInput);
    await user.type(budgetInput, '150');

    expect(nameInput).toHaveValue('Jane Smith');
    expect(countrySelect).toHaveDisplayValue('United States');
    expect(currencySelect).toHaveDisplayValue('USD');
    expect(budgetInput).toHaveValue(150);
  });

  it('validates required name before advancing', async () => {
    const { user } = renderFriendForm();

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i);
  });

  it('toggles personality traits on step three', async () => {
    const { user } = renderFriendForm();

    await user.type(screen.getByLabelText(/friend's name/i), 'Test Friend');
    await advanceToStep(user, 3);

    const funnyTrait = screen.getByRole('button', { name: 'Funny' });
    await user.click(funnyTrait);
    expect(funnyTrait).toHaveClass('selected');

    await user.click(funnyTrait);
    expect(funnyTrait).not.toHaveClass('selected');
  });

  it('allows adding custom trait and interest', async () => {
    const { user } = renderFriendForm();

    await user.type(screen.getByLabelText(/friend's name/i), 'Test Friend');
    await advanceToStep(user, 3);

    const traitInput = screen.getByPlaceholderText(/add custom trait/i);
    await user.type(traitInput, 'Thoughtful{enter}');
    const selectedTraits = screen.getByText(/selected traits/i).parentElement;
    expect(selectedTraits).toBeTruthy();
    expect(within(selectedTraits as HTMLElement).getByText('Thoughtful')).toBeInTheDocument();

    await advanceToStep(user, 4);
    const interestInput = screen.getByPlaceholderText(/add custom interest/i);
    await user.type(interestInput, 'Rock Climbing{enter}');
    const selectedInterests = screen.getByText(/selected interests/i).parentElement;
    expect(selectedInterests).toBeTruthy();
    expect(within(selectedInterests as HTMLElement).getByText('Rock Climbing')).toBeInTheDocument();
  });

  it('collects notes on the final step', async () => {
    const { user } = renderFriendForm();

    await user.type(screen.getByLabelText(/friend's name/i), 'Test Friend');
    await advanceToStep(user, 5);

    const notesInput = screen.getByLabelText(/notes/i);
    await user.type(notesInput, 'Additional notes about my friend');

    expect(notesInput).toHaveValue('Additional notes about my friend');
  });

  it('accepts profile picture url input', async () => {
    const { user } = renderFriendForm();
    const urlInput = screen.getByLabelText(/profile picture url/i);
    await user.type(urlInput, 'https://example.com/image.jpg');

    expect(urlInput).toHaveValue('https://example.com/image.jpg');
  });

  it('submits form with valid data and closes modal', async () => {
    const onClose = vi.fn();
    const { user } = renderFriendForm({ onClose });

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-friend' }),
    } as unknown as Response);

    await user.type(screen.getByLabelText(/friend's name/i), 'Test Friend');
    await user.selectOptions(screen.getByLabelText(/country/i), 'United States');
    await user.selectOptions(screen.getByLabelText(/currency/i), 'USD');
    await user.clear(screen.getByLabelText(/budget/i));
    await user.type(screen.getByLabelText(/budget/i), '200');

    await advanceToStep(user, 5);
    await user.type(screen.getByLabelText(/notes/i), 'Notes go here');

    const saveButton = screen.getByRole('button', { name: /save friend/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/friends',
        expect.objectContaining({ method: 'POST' })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays an error when submission fails', async () => {
    const { user } = renderFriendForm();

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed' }),
    } as unknown as Response);

    await user.type(screen.getByLabelText(/friend's name/i), 'Test Friend');
    await advanceToStep(user, 5);

    const saveButton = screen.getByRole('button', { name: /save friend/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to create friend/i);
    });
  });

  it('supports cancelling the form', async () => {
    const onClose = vi.fn();
    const { user } = renderFriendForm({ onClose });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('supports keyboard navigation starting at the name input', async () => {
    const { user } = renderFriendForm();

    const nameInput = screen.getByLabelText(/friend's name/i);

    for (let i = 0; i < 10 && document.activeElement !== nameInput; i += 1) {
      await user.tab();
    }

    expect(nameInput).toHaveFocus();
  });
});
