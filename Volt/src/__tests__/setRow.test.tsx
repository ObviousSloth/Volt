/**
 * Component tests for the workout set row.
 *
 * NOTE: @testing-library/react-native v14 made render() async.
 * All tests must be async and await render().
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { SetRow } from '@/components/SetRow';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProps(overrides: Partial<React.ComponentProps<typeof SetRow>> = {}) {
  return {
    setNumber: 1,
    reps: 8,
    weightKg: 60,
    completed: false,
    onToggleDone: jest.fn(),
    onChangeReps: jest.fn(),
    onChangeWeight: jest.fn(),
    onRemove: jest.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('SetRow', () => {
  it('renders the set number', async () => {
    await render(<SetRow {...makeProps()} />);
    expect(screen.getByTestId('set-number').props.children).toBe(1);
  });

  it('renders the reps value in the input', async () => {
    await render(<SetRow {...makeProps({ reps: 10 })} />);
    expect(screen.getByTestId('reps-input').props.value).toBe('10');
  });

  it('renders the weight value in the input', async () => {
    await render(<SetRow {...makeProps({ weightKg: 62.5 })} />);
    expect(screen.getByTestId('weight-input').props.value).toBe('62.5');
  });

  it('shows done state when completed is true', async () => {
    await render(<SetRow {...makeProps({ completed: true })} />);
    expect(screen.getByTestId('done-button').props.children).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Toggle done
  // ---------------------------------------------------------------------------

  it('calls onToggleDone when the done button is pressed', async () => {
    const onToggleDone = jest.fn();
    await render(<SetRow {...makeProps({ onToggleDone })} />);
    fireEvent.press(screen.getByTestId('done-button'));
    expect(onToggleDone).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggleDone when pressing other elements', async () => {
    const onToggleDone = jest.fn();
    await render(<SetRow {...makeProps({ onToggleDone })} />);
    fireEvent.press(screen.getByTestId('remove-button'));
    expect(onToggleDone).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Edit values
  // ---------------------------------------------------------------------------

  it('calls onChangeReps with a number when reps input changes', async () => {
    const onChangeReps = jest.fn();
    await render(<SetRow {...makeProps({ onChangeReps })} />);
    fireEvent.changeText(screen.getByTestId('reps-input'), '12');
    expect(onChangeReps).toHaveBeenCalledWith(12);
  });

  it('calls onChangeWeight with a number when weight input changes', async () => {
    const onChangeWeight = jest.fn();
    await render(<SetRow {...makeProps({ onChangeWeight })} />);
    fireEvent.changeText(screen.getByTestId('weight-input'), '65');
    expect(onChangeWeight).toHaveBeenCalledWith(65);
  });

  it('passes fractional weights correctly', async () => {
    const onChangeWeight = jest.fn();
    await render(<SetRow {...makeProps({ onChangeWeight })} />);
    fireEvent.changeText(screen.getByTestId('weight-input'), '22.5');
    expect(onChangeWeight).toHaveBeenCalledWith(22.5);
  });

  // ---------------------------------------------------------------------------
  // Remove
  // ---------------------------------------------------------------------------

  it('calls onRemove when the remove button is pressed', async () => {
    const onRemove = jest.fn();
    await render(<SetRow {...makeProps({ onRemove })} />);
    fireEvent.press(screen.getByTestId('remove-button'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not call onRemove when pressing the done button', async () => {
    const onRemove = jest.fn();
    await render(<SetRow {...makeProps({ onRemove })} />);
    fireEvent.press(screen.getByTestId('done-button'));
    expect(onRemove).not.toHaveBeenCalled();
  });
});
