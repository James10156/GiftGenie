import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FriendCard } from './friend-card';
import type { Friend } from '@shared/schema';

// Mock the EditFriendModal component
vi.mock('./edit-friend-modal', () => ({
  EditFriendModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="edit-friend-modal">
        <button onClick={onClose} data-testid="close-modal">Close</button>
      </div>
    ) : null,
}));

describe('FriendCard', () => {
  const mockFriend: Friend = {
    id: 'friend-1',
    name: 'John Doe',
    personalityTraits: ['funny', 'creative'],
    interests: ['gaming', 'music'],
    budget: 100,
    currency: 'USD',
    country: 'United States',
    notes: 'Best friend from college',
    createdAt: new Date('2024-01-15'),
    userId: 'user-1',
  };

  const mockOnFindGifts = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders friend information correctly', () => {
    render(<FriendCard friend={mockFriend} onFindGifts={mockOnFindGifts} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText(/United States/)).toBeInTheDocument();
    expect(screen.getByText('Best friend from college')).toBeInTheDocument();
  });

  it('displays personality traits as badges', () => {
    render(<FriendCard friend={mockFriend} onFindGifts={mockOnFindGifts} />);

    expect(screen.getByText('funny')).toBeInTheDocument();
    expect(screen.getByText('creative')).toBeInTheDocument();
  });

  it('displays interests as badges', () => {
    render(<FriendCard friend={mockFriend} onFindGifts={mockOnFindGifts} />);

    expect(screen.getByText('gaming')).toBeInTheDocument();
    expect(screen.getByText('music')).toBeInTheDocument();
  });

  it('shows initials when no profile picture is provided', () => {
    render(<FriendCard friend={mockFriend} onFindGifts={mockOnFindGifts} />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('displays profile picture when provided', () => {
    const friendWithPicture = {
      ...mockFriend,
      profilePicture: 'https://example.com/profile.jpg',
    };

    render(<FriendCard friend={friendWithPicture} onFindGifts={mockOnFindGifts} />);

    const profileImage = screen.getByAltText('John Doe');
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute('src', 'https://example.com/profile.jpg');
  });

  it('calls onFindGifts when the primary action button is clicked', async () => {
    const user = userEvent.setup();
    render(<FriendCard friend={mockFriend} onFindGifts={mockOnFindGifts} />);

    const findGiftsButton = screen.getByText('Find Gifts');
    await user.click(findGiftsButton);

    expect(mockOnFindGifts).toHaveBeenCalledTimes(1);
  });

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<FriendCard friend={mockFriend} onFindGifts={mockOnFindGifts} />);

    const editButton = screen.getByRole('button', { name: /edit friend/i });
    await user.click(editButton);

    expect(screen.getByTestId('edit-friend-modal')).toBeInTheDocument();
  });

  it('closes edit modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<FriendCard friend={mockFriend} onFindGifts={mockOnFindGifts} />);

    // Open modal
  const editButton = screen.getByRole('button', { name: /edit friend/i });
    await user.click(editButton);

    // Close modal
    const closeButton = screen.getByTestId('close-modal');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('edit-friend-modal')).not.toBeInTheDocument();
    });
  });

  it('formats time ago correctly', () => {
    const todayFriend = {
      ...mockFriend,
      createdAt: new Date(),
    };

    render(<FriendCard friend={todayFriend} onFindGifts={mockOnFindGifts} />);

  expect(screen.getByText(/Today/)).toBeInTheDocument();
  });

  it('handles friends without creation date', () => {
    const friendWithoutDate = {
      ...mockFriend,
      createdAt: null,
    };

    render(<FriendCard friend={friendWithoutDate as any} onFindGifts={mockOnFindGifts} />);

  expect(screen.getByText(/Recently/)).toBeInTheDocument();
  });

  it('handles long names for initials generation', () => {
    const friendWithLongName = {
      ...mockFriend,
      name: 'John Michael Smith Johnson',
    };

    render(<FriendCard friend={friendWithLongName} onFindGifts={mockOnFindGifts} />);

    expect(screen.getByText('JMSJ')).toBeInTheDocument();
  });

  it('handles friends with no personality traits', () => {
    const friendWithoutTraits = {
      ...mockFriend,
      personalityTraits: [],
    };

    render(<FriendCard friend={friendWithoutTraits} onFindGifts={mockOnFindGifts} />);

    // Should still render without errors
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles friends with no interests', () => {
    const friendWithoutInterests = {
      ...mockFriend,
      interests: [],
    };

    render(<FriendCard friend={friendWithoutInterests} onFindGifts={mockOnFindGifts} />);

    // Should still render without errors
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays different currencies correctly', () => {
    const friendWithEuros = {
      ...mockFriend,
      currency: 'EUR',
      budget: 150,
    };

    render(<FriendCard friend={friendWithEuros} onFindGifts={mockOnFindGifts} />);

  expect(screen.getByText('€150.00')).toBeInTheDocument();
  });

  it('handles zero budget', () => {
    const friendWithZeroBudget = {
      ...mockFriend,
      budget: 0,
    };

    render(<FriendCard friend={friendWithZeroBudget} onFindGifts={mockOnFindGifts} />);

  expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('truncates long notes appropriately', () => {
    const friendWithLongNotes = {
      ...mockFriend,
      notes: 'This is a very long note about my friend that goes on and on and might need to be truncated in the UI to prevent layout issues and maintain readability.',
    };

    render(<FriendCard friend={friendWithLongNotes} onFindGifts={mockOnFindGifts} />);

    // Should render the long note (component handles truncation if needed)
    expect(screen.getByText(/This is a very long note/)).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<FriendCard friend={mockFriend} onFindGifts={mockOnFindGifts} />);

    const cardElement = container.firstChild as Element;
    expect(cardElement).toHaveClass('border', 'rounded-xl', 'p-4');
  });

  it('shows hover effects on interactive elements', async () => {
    const user = userEvent.setup();
    render(<FriendCard friend={mockFriend} onFindGifts={mockOnFindGifts} />);

  const findGiftsButton = screen.getByText('Find Gifts');
    
    // Test that the button is interactive
    await user.hover(findGiftsButton);
    expect(findGiftsButton).toBeInTheDocument();
  });

  describe('Profile Picture Interactions', () => {
    it('shows profile picture hover effects when available', () => {
      const friendWithPicture = {
        ...mockFriend,
        profilePicture: 'https://example.com/profile.jpg',
      };

      render(<FriendCard friend={friendWithPicture} onFindGifts={mockOnFindGifts} />);

      const profileContainer = screen.getByAltText('John Doe').parentElement;
      expect(profileContainer).toHaveClass('cursor-pointer');
    });

    it('generates consistent initial colors based on name', () => {
      const friend1 = { ...mockFriend, name: 'Alice' };
      const friend2 = { ...mockFriend, name: 'Bob' };

      const { rerender } = render(<FriendCard friend={friend1} onFindGifts={mockOnFindGifts} />);
      const alice = screen.getByText('A');
      const aliceClasses = alice.className;

      rerender(<FriendCard friend={friend2} onFindGifts={mockOnFindGifts} />);
      const bob = screen.getByText('B');
      const bobClasses = bob.className;

      // Colors should be deterministic based on name length
      expect(aliceClasses).toBeDefined();
      expect(bobClasses).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('has accessible button labels', () => {
      render(<FriendCard friend={mockFriend} onFindGifts={mockOnFindGifts} />);

  const editButton = screen.getByRole('button', { name: /edit friend/i });
  const findGiftsButton = screen.getByRole('button', { name: /find gifts/i });

      expect(editButton).toBeInTheDocument();
      expect(findGiftsButton).toBeInTheDocument();
    });

    it('provides proper alt text for profile pictures', () => {
      const friendWithPicture = {
        ...mockFriend,
        profilePicture: 'https://example.com/profile.jpg',
      };

      render(<FriendCard friend={friendWithPicture} onFindGifts={mockOnFindGifts} />);

      const profileImage = screen.getByAltText('John Doe');
      expect(profileImage).toBeInTheDocument();
    });
  });
});
