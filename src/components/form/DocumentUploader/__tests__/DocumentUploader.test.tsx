import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { DOCUMENT_UPLOADER_INPUT_TEST_ID, DocumentUploader } from '../DocumentUploader'

const makeFile = (name: string, type: string, sizeBytes: number) => {
  const file = new File(['x'], name, { type })

  Object.defineProperty(file, 'size', { value: sizeBytes })

  return file
}

const baseProps = {
  accept: 'application/pdf,image/jpeg,image/png',
  acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  maxSize: 10 * 1024 * 1024,
  title: 'Click to upload',
  description: 'PDF, JPG, PNG < 10MB',
  invalidTypeError: 'Invalid type',
  tooLargeError: 'Too large',
}

describe('DocumentUploader', () => {
  it('emits a base64 string when a valid file is selected', async () => {
    const onChange = jest.fn()

    render(<DocumentUploader value={null} onChange={onChange} {...baseProps} />)

    fireEvent.change(screen.getByTestId(DOCUMENT_UPLOADER_INPUT_TEST_ID), {
      target: { files: [makeFile('doc.pdf', 'application/pdf', 1000)] },
    })

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('data:'))
    })
  })

  it('rejects a file larger than maxSize and does not emit a value', async () => {
    const onChange = jest.fn()

    render(<DocumentUploader value={null} onChange={onChange} {...baseProps} />)

    fireEvent.change(screen.getByTestId(DOCUMENT_UPLOADER_INPUT_TEST_ID), {
      target: { files: [makeFile('big.pdf', 'application/pdf', 11 * 1024 * 1024)] },
    })

    await waitFor(() => {
      expect(screen.getByText('Too large')).toBeInTheDocument()
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('rejects an unsupported file type and does not emit a value', async () => {
    const onChange = jest.fn()

    render(<DocumentUploader value={null} onChange={onChange} {...baseProps} />)

    fireEvent.change(screen.getByTestId(DOCUMENT_UPLOADER_INPUT_TEST_ID), {
      target: { files: [makeFile('virus.exe', 'application/octet-stream', 1000)] },
    })

    await waitFor(() => {
      expect(screen.getByText('Invalid type')).toBeInTheDocument()
    })
    expect(onChange).not.toHaveBeenCalled()
  })
})
