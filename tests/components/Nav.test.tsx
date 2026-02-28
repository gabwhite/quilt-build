import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Nav } from '../../src/components/Nav'

test('renders all three nav tabs', () => {
  render(<Nav view="editor" onChange={() => {}} />)
  expect(screen.getByText('Block Editor')).toBeInTheDocument()
  expect(screen.getByText('Quilt Assembler')).toBeInTheDocument()
  expect(screen.getByText('Cutting Plan')).toBeInTheDocument()
})

test('calls onChange with correct view when tab clicked', async () => {
  const onChange = vi.fn()
  render(<Nav view="editor" onChange={onChange} />)
  await userEvent.click(screen.getByText('Quilt Assembler'))
  expect(onChange).toHaveBeenCalledWith('assembler')
})

test('sets aria-current only on the active tab', () => {
  render(<Nav view="editor" onChange={() => {}} />)
  expect(screen.getByText('Block Editor')).toHaveAttribute('aria-current', 'page')
  expect(screen.getByText('Quilt Assembler')).not.toHaveAttribute('aria-current')
  expect(screen.getByText('Cutting Plan')).not.toHaveAttribute('aria-current')
})
