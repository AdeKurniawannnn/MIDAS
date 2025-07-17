import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button Component', () => {
  test('renders correctly', () => {
    render(<Button>Test Button</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Test Button')
  })

  test('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    
    render(<Button onClick={handleClick}>Clickable Button</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('applies variant classes correctly', () => {
    render(<Button variant="destructive">Destructive Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  test('applies size classes correctly', () => {
    render(<Button size="sm">Small Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-8')
  })

  test('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  test('renders as different element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    expect(screen.getByRole('link')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test')
  })

  test('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  test('supports different button types', () => {
    render(<Button type="submit">Submit Button</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})