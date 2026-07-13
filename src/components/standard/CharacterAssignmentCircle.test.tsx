import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CharacterAssignmentCircle from './CharacterAssignmentCircle';
import type { Player } from '../../types';

describe('CharacterAssignmentCircle', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Alice', isDead: false },
    { id: 'p2', name: 'Bob', isDead: false },
  ];

  const defaultProps = {
    players,
    isLightModeActive: false,
    setActivePlayerId: vi.fn(),
    setSearchTerm: vi.fn(),
    draggedIndex: null,
    dragOverIndex: null,
    hoverSide: null,
    handleMouseDown: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
    handleDragEnd: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
  };

  it('does not show a sync icon for any player when remotePlayerIds is not provided', () => {
    render(<CharacterAssignmentCircle {...defaultProps} />);
    expect(document.querySelector('#edit-player-button-p1 svg.lucide-wifi')).toBeNull();
    expect(document.querySelector('#edit-player-button-p2 svg.lucide-wifi')).toBeNull();
  });

  it('shows a sync icon only next to players who joined remotely', () => {
    render(<CharacterAssignmentCircle {...defaultProps} remotePlayerIds={new Set(['p2'])} />);

    expect(document.querySelector('#edit-player-button-p1 svg.lucide-wifi')).toBeNull();
    expect(document.querySelector('#edit-player-button-p2 svg.lucide-wifi')).not.toBeNull();
  });

  it('still renders the player name alongside the sync icon', () => {
    render(<CharacterAssignmentCircle {...defaultProps} remotePlayerIds={new Set(['p2'])} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('enables dragging when isSecondary is true', () => {
    const { container } = render(
      <CharacterAssignmentCircle
        {...defaultProps}
      />
    );

    // Draggable attribute should be true
    const playerTokenDiv = container.querySelector('[data-drag-index="0"]');
    expect(playerTokenDiv).toHaveAttribute('draggable', 'true');
  });

  describe('rotation', () => {
    const four: Player[] = [
      { id: 'p1', name: 'Alice', isDead: false },
      { id: 'p2', name: 'Bob', isDead: false },
      { id: 'p3', name: 'Charlie', isDead: false },
      { id: 'p4', name: 'Dave', isDead: false },
    ];

    const seatedIds = (container: HTMLElement) =>
      [...container.querySelectorAll('[data-drag-index]')].map(
        el => el.querySelector('button[id^="edit-player-button-"]')!.id.replace('edit-player-button-', '')
      );

    const dragIndices = (container: HTMLElement) =>
      [...container.querySelectorAll('[data-drag-index]')].map(el => el.getAttribute('data-drag-index'));

    it('seats players in player order when there is no rotation', () => {
      const { container } = render(<CharacterAssignmentCircle {...defaultProps} players={four} />);
      expect(seatedIds(container)).toEqual(['p1', 'p2', 'p3', 'p4']);
    });

    it('seats players rotated by the offset, the same way the grimoire board does', () => {
      const { container } = render(
        <CharacterAssignmentCircle {...defaultProps} players={four} rotationOffset={1} />
      );
      expect(seatedIds(container)).toEqual(['p2', 'p3', 'p4', 'p1']);

      cleanup();

      const wrapped = render(
        <CharacterAssignmentCircle {...defaultProps} players={four} rotationOffset={-1} />
      );
      expect(seatedIds(wrapped.container)).toEqual(['p4', 'p1', 'p2', 'p3']);
    });

    it('keeps drag indices pointing at the player array, not the seat', () => {
      const { container } = render(
        <CharacterAssignmentCircle {...defaultProps} players={four} rotationOffset={1} />
      );
      expect(dragIndices(container)).toEqual(['1', '2', '3', '0']);
    });

    it('rotates in both directions from the buttons', () => {
      const onRotationChange = vi.fn();
      const { container } = render(
        <CharacterAssignmentCircle
          {...defaultProps}
          players={four}
          rotationOffset={2}
          onRotationChange={onRotationChange}
        />
      );

      fireEvent.click(container.querySelector('#setup-rotate-ccw-button')!);
      expect(onRotationChange).toHaveBeenCalledWith(3);

      fireEvent.click(container.querySelector('#setup-rotate-cw-button')!);
      expect(onRotationChange).toHaveBeenCalledWith(1);
    });

    it('hides the rotate buttons when rotation is not wired up', () => {
      const { container } = render(<CharacterAssignmentCircle {...defaultProps} players={four} />);
      expect(container.querySelector('#setup-rotate-ccw-button')).toBeNull();
    });
  });
});
