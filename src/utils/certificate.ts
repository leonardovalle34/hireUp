import jsPDF from 'jspdf';

export function generateCertificate(userName: string, completionDate: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fundo branco
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Borda azul externa
  doc.setDrawColor(0, 22, 51); // #001633
  doc.setLineWidth(3);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Borda azul interna fina
  doc.setDrawColor(29, 78, 216); // #1d4ed8
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Logo / Nome HireUp
  doc.setTextColor(0, 22, 51);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('HireUp', pageWidth / 2, 35, { align: 'center' });

  // Linha decorativa
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 30, 40, pageWidth / 2 + 30, 40);

  // Título do certificado
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('CERTIFICADO DE CONCLUSÃO', pageWidth / 2, 55, { align: 'center' });

  // Texto principal
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text('Certificamos que', pageWidth / 2, 75, { align: 'center' });

  // Nome do aluno
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 22, 51);
  doc.text(userName, pageWidth / 2, 92, { align: 'center' });

  // Linha sob o nome
  const nameWidth = doc.getTextWidth(userName);
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - nameWidth / 2 - 5, 96, pageWidth / 2 + nameWidth / 2 + 5, 96);

  // Texto de conclusão
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(
    'concluiu com êxito o curso de Inglês Profissional HireUp,',
    pageWidth / 2, 112, { align: 'center' }
  );
  doc.text(
    'com carga horária total de 60 horas, abrangendo desde o nível',
    pageWidth / 2, 120, { align: 'center' }
  );
  doc.text(
    'iniciante até o avançado, incluindo Business English.',
    pageWidth / 2, 128, { align: 'center' }
  );

  // Data
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Concluído em ${completionDate}`, pageWidth / 2, 145, { align: 'center' });

  // Selo HireUp no canto
  doc.setFillColor(29, 78, 216);
  doc.circle(pageWidth - 35, pageHeight - 30, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('HireUp', pageWidth - 35, pageHeight - 32, { align: 'center' });
  doc.text('Certified', pageWidth - 35, pageHeight - 28, { align: 'center' });

  return doc;
}

export function downloadCertificate(userName: string) {
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const doc = generateCertificate(userName, date);
  doc.save(`Certificado_HireUp_${userName.replace(/\s+/g, '_')}.pdf`);
}
