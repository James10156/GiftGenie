import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FriendForm } from './FriendForm';
import type { Friend } from '@shared/schema';

// Mock the authenticated fetch hook
vi.mock('../hooks/use-authenticated-fetch', () => ({
  useAuthenticatedFetch: () => ({
    authenticatedFetch: vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-friend-id', name: 'Test Friend' }),
    }),
  }),
}));

// Create a test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('FriendForm', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty form for new friend', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    expect(screen.getByLabelText(/friend's name/i)).toHaveValue('');
    expect(screen.getByDisplayValue('United Kingdom')).toBeInTheDocument();
    expect(screen.getByDisplayValue('GBP')).toBeInTheDocument();
  });

  it('pre-fills form when editing existing friend', () => {
    const existingFriend: Friend = {
      id: 'friend-1',
      name: 'John Doe',
      personalityTraits: ['funny', 'creative'],
      interests: ['gaming', 'music'],
      budget: 100,
      currency: 'USD',
      country: 'United States',
      notes: 'Best friend',
      createdAt: new Date(),
      userId: 'user-1',
    };

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm friend={existingFriend} onClose={mockOnClose} />
      </Wrapper>
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('United States')).toBeInTheDocument();
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Best friend')).toBeInTheDocument();
  });

  it('allows user to input friend name', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const nameInput = screen.getByLabelText(/friend's name/i);
    await user.type(nameInput, 'Jane Smith');

    expect(nameInput).toHaveValue('Jane Smith');
  });

  it('allows user to select country', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const countrySelect = screen.getByDisplayValue('United Kingdom');
    await user.selectOptions(countrySelect, 'United States');

    expect(screen.getByDisplayValue('United States')).toBeInTheDocument();
  });

  it('allows user to select currency', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const currencySelect = screen.getByDisplayValue('GBP');
    await user.selectOptions(currencySelect, 'USD');

    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
  });

  it('allows user to set budget', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const budgetInput = screen.getByLabelText(/budget/i);
    await user.clear(budgetInput);
    await user.type(budgetInput, '150');

    expect(budgetInput).toHaveValue(150);
  });

  it('allows user to add personality traits', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    // Find and click on a personality trait
    const funnyTrait = screen.getByText('Funny');
    await user.click(funnyTrait);

    // The trait should be selected (you might need to check for a specific class or attribute)
    expect(funnyTrait.closest('button')).toHaveClass('selected'); // Adjust based on actual implementation
  });

  it('allows user to add interests', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    // Find and click on an interest
    const gamingInterest = screen.getByText('Gaming');
    await user.click(gamingInterest);

    // The interest should be selected
    expect(gamingInterest.closest('button')).toHaveClass('selected'); // Adjust based on actual implementation
  });

  it('allows user to add custom personality trait', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const customTraitInput = screen.getByPlaceholderText(/add custom trait/i);
    await user.type(customTraitInput, 'Unique Trait{enter}');

    // Should show the custom trait in the selected traits
    expect(screen.getByText('Unique Trait')).toBeInTheDocument();
  });

  it('allows user to add custom interest', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const customInterestInput = screen.getByPlaceholderText(/add custom interest/i);
    await user.type(customInterestInput, 'Custom Hobby{enter}');

    // Should show the custom interest in the selected interests
    expect(screen.getByText('Custom Hobby')).toBeInTheDocument();
  });

  it('allows user to add notes', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const notesTextarea = screen.getByLabelText(/notes/i);
    await user.type(notesTextarea, 'Additional notes about my friend');

    expect(notesTextarea).toHaveValue('Additional notes about my friend');
  });

  it('validates required fields before submission', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByText(/save friend/i);
    await user.click(submitButton);

    // Should show validation errors
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    // Fill out the form
    await user.type(screen.getByLabelText(/friend's name/i), 'Test Friend');
    await user.type(screen.getByLabelText(/budget/i), '100');

    // Submit the form
    const submitButton = screen.getByText(/save friend/i);
    await user.click(submitButton);

    // Should close the form after successful submission
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const cancelButton = screen.getByText(/cancel/i);
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles form submission errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock a failed submission
    vi.doMock('../hooks/use-authenticated-fetch', () => ({
      useAuthenticatedFetch: () => ({
        authenticatedFetch: vi.fn().mockRejectedValue(new Error('Submission failed')),
      }),
    }));

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    // Fill out and submit the form
    await user.type(screen.getByLabelText(/friend's name/i), 'Test Friend');
    await user.type(screen.getByLabelText(/budget/i), '100');

    const submitButton = screen.getByText(/save friend/i);
    await user.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('removes selected traits when clicked again', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const funnyTrait = screen.getByText('Funny');
    
    // Select the trait
    await user.click(funnyTrait);
    expect(funnyTrait.closest('button')).toHaveClass('selected');

    // Deselect the trait
    await user.click(funnyTrait);
    expect(funnyTrait.closest('button')).not.toHaveClass('selected');
  });

  it('handles profile picture URL input', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const profilePictureInput = screen.getByLabelText(/profile picture/i);
    await user.type(profilePictureInput, 'https://example.com/profile.jpg');

    expect(profilePictureInput).toHaveValue('https://example.com/profile.jpg');
  });

  it('updates currency when country is changed', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <FriendForm onClose={mockOnClose} />
      </Wrapper>
    );

    const countrySelect = screen.getByDisplayValue('United Kingdom');
    await user.selectOptions(countrySelect, 'United States');

    // Currency should automatically update to USD
    await waitFor(() => {
      expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <FriendForm onClose={mockOnClose} />
        </Wrapper>
      );

      expect(screen.getByLabelText(/friend's name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/budget/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <FriendForm onClose={mockOnClose} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/friend's name/i);
      
      // Tab navigation should work
      await user.tab();
      expect(nameInput).toHaveFocus();
    });
  });
});
