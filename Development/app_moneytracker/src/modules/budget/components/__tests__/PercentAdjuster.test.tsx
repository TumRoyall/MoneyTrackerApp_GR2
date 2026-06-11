import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PercentAdjuster } from '../PercentAdjuster';

describe('PercentAdjuster', () => {
  it('renders current percent value', () => {
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={() => {}} />
    );
    expect(getByTestId('percent-input').props.value).toBe('25');
  });

  it('renders the amount as formatted VND', () => {
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={() => {}} />
    );
    // The amount-display is a Text with two children: ['= ', '₫5.000.000'].
    // Flatten to a string and assert the VND-formatted amount appears.
    const node = getByTestId('amount-display');
    const flatten = (children: React.ReactNode): string => {
      if (children == null || typeof children === 'boolean') return '';
      if (typeof children === 'string' || typeof children === 'number') return String(children);
      if (Array.isArray(children)) return children.map(flatten).join('');
      return '';
    };
    expect(flatten(node.props.children)).toContain('5.000.000');
  });

  it('calls onChange with -5 when minus button is pressed', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={onChange} />
    );
    fireEvent.press(getByTestId('minus-button'));
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it('calls onChange with +5 when plus button is pressed', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={onChange} />
    );
    fireEvent.press(getByTestId('plus-button'));
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it('clamps minus button to 0 (no negative)', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={2} amount={400000} onChange={onChange} />
    );
    fireEvent.press(getByTestId('minus-button'));
    expect(onChange).toHaveBeenCalledWith(0);  // 2 - 5 = -3, clamped to 0
  });

  it('clamps plus button to 100', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={98} amount={19600000} onChange={onChange} />
    );
    fireEvent.press(getByTestId('plus-button'));
    expect(onChange).toHaveBeenCalledWith(100);  // 98 + 5 = 103, clamped to 100
  });

  it('calls onChange with typed value when input changes', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={onChange} />
    );
    fireEvent.changeText(getByTestId('percent-input'), '40');
    expect(onChange).toHaveBeenCalledWith(40);
  });

  it('rejects non-numeric input (passes 0)', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={onChange} />
    );
    fireEvent.changeText(getByTestId('percent-input'), 'abc');
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('disables both buttons when disabled prop is true', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={20} amount={4000000} onChange={onChange} disabled />
    );
    fireEvent.press(getByTestId('minus-button'));
    fireEvent.press(getByTestId('plus-button'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    const { getByTestId } = render(
      <PercentAdjuster percent={20} amount={4000000} onChange={() => {}} disabled />
    );
    expect(getByTestId('percent-input').props.editable).toBe(false);
  });
});
