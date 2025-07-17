import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input Component', () => {
  test('renders correctly', () => {
    render(<Input placeholder="Test input" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument()
  })

  test('handles value changes', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<Input onChange={handleChange} />)
    
    await user.type(screen.getByRole('textbox'), 'hello')
    expect(handleChange).toHaveBeenCalledTimes(5) // Once for each character
  })

  test('can be controlled', () => {
    const { rerender } = render(<Input value="initial" readOnly />)
    expect(screen.getByRole('textbox')).toHaveValue('initial')
    
    rerender(<Input value="updated" readOnly />)
    expect(screen.getByRole('textbox')).toHaveValue('updated')
  })

  test('supports different input types', () => {
    render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
  })

  test('can be disabled', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  test('applies custom className', () => {
    render(<Input className="custom-input" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-input')
  })

  test('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  test('supports required attribute', () => {
    render(<Input required />)
    expect(screen.getByRole('textbox')).toBeRequired()
  })

  test('supports min and max attributes for number inputs', () => {
    render(<Input type="number" min="0" max="100" />)
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
  })

  test('supports pattern attribute', () => {
    render(<Input pattern="[0-9]*" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]*')
  })
})