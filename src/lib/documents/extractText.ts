import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export type SupportedDocumentType = 'pdf' | 'docx' | 'txt';

export interface ExtractedDocument {
  content: string;
  fileType: SupportedDocumentType;
}

export class DocumentExtractionError extends Error {
  readonly status: 400 | 413;

  constructor(message: string, status: 400 | 413 = 400) {
    super(message);
    this.name = 'DocumentExtractionError';
    this.status = status;
  }
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_PAGES = 100;
const MAX_EXTRACTED_CHARACTERS = 2_000_000;

export async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  if (file.size === 0) {
    throw new DocumentExtractionError('Choose a non-empty document');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new DocumentExtractionError('Document exceeds the 5 MB upload limit', 413);
  }

  const fileName = file.name.trim();
  const extension = fileName.split('.').pop()?.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let content: string;
  let fileType: SupportedDocumentType;

  if (extension === 'pdf') {
    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') {
      throw new DocumentExtractionError('The selected file is not a valid PDF');
    }

    const parser = new PDFParse({ data: bytes });
    try {
      const info = await parser.getInfo();
      if (info.total > MAX_PDF_PAGES) {
        throw new DocumentExtractionError('PDF documents cannot exceed 100 pages');
      }
      content = (await parser.getText()).text;
    } catch (error) {
      if (error instanceof DocumentExtractionError) throw error;
      throw new DocumentExtractionError('The PDF could not be read. Check that it is not damaged or password-protected.');
    } finally {
      await parser.destroy();
    }
    fileType = 'pdf';
  } else if (extension === 'docx') {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new DocumentExtractionError('The selected file is not a valid DOCX document');
    }
    try {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      content = result.value;
    } catch {
      throw new DocumentExtractionError('The DOCX document could not be read');
    }
    fileType = 'docx';
  } else if (extension === 'txt') {
    try {
      content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw new DocumentExtractionError('Text documents must use UTF-8 encoding');
    }
    fileType = 'txt';
  } else {
    throw new DocumentExtractionError('Supported document formats are PDF, DOCX, and TXT');
  }

  const normalizedContent = content.trim();
  if (!normalizedContent) {
    throw new DocumentExtractionError('No readable text was found in the document');
  }
  if (normalizedContent.length > MAX_EXTRACTED_CHARACTERS) {
    throw new DocumentExtractionError('Extracted document text exceeds the 2 MB limit', 413);
  }

  return { content: normalizedContent, fileType };
}

export const documentUploadLimits = {
  maxFileBytes: MAX_FILE_BYTES,
  maxExtractedCharacters: MAX_EXTRACTED_CHARACTERS,
};
