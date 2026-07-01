import { describe, it, expect, vi, beforeEach } from 'vitest';
import jsPDF from 'jspdf';
import { generateCertificate, downloadCertificate } from '@/utils/certificate';

vi.mock('jspdf', () => {
  const mockDoc = {
    internal: { pageSize: { getWidth: () => 297, getHeight: () => 210 } },
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    getTextWidth: vi.fn(() => 50),
    circle: vi.fn(),
    save: vi.fn(),
  };
  return { default: vi.fn(function jsPDFMock() { return mockDoc; }) };
});

describe('certificate util', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates the PDF in A4 landscape with the student name and completion date', () => {
    const doc = generateCertificate('Fulano de Tal', '01 de julho de 2026');

    expect(jsPDF).toHaveBeenCalledWith({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    expect(doc.text).toHaveBeenCalledWith(
      'Fulano de Tal',
      expect.any(Number),
      expect.any(Number),
      { align: 'center' },
    );
    expect(doc.text).toHaveBeenCalledWith(
      'Concluído em 01 de julho de 2026',
      expect.any(Number),
      expect.any(Number),
      { align: 'center' },
    );
  });

  it('downloadCertificate saves the PDF with a sanitized file name (spaces become underscores)', () => {
    downloadCertificate('Fulano de Tal');

    const doc = vi.mocked(jsPDF).mock.results[0].value;
    expect(doc.save).toHaveBeenCalledWith('Certificado_HireUp_Fulano_de_Tal.pdf');
  });
});
