import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';

/**
 * Export Laporan Rekap ke Format Dokumen Microsoft Word (.docx)
 */
export const exportDatabaseHMToWord = async (heList = [], dtList = [], filterDate = '') => {
  const tableRows = [
    // Header Row
    new TableRow({
      tableHeader: true,
      children: [
        'No', 'Tanggal', 'Shift', 'Model Unit', 'No Unit', 'HM Awal', 'HM Akhir', 'Total HM', 'Operator / Driver'
      ].map(text => new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })]
          })
        ],
        shading: { fill: '1E3A8A' } // Royal Blue LCM
      }))
    })
  ];

  // Combine rows
  let counter = 1;

  heList.forEach(item => {
    tableRows.push(
      new TableRow({
        children: [
          String(counter++),
          item.tanggal || '-',
          item.shift || '-',
          item.model_unit || '-',
          item.unit_code || '-',
          String(Number(item.hm_awal || 0).toFixed(1)),
          String(Number(item.hm_akhir || 0).toFixed(1)),
          String(Number(item.total_hm || 0).toFixed(1)),
          `${item.nama_opt || '-'} (Opt)`
        ].map((cellText, idx) => new TableCell({
          children: [
            new Paragraph({
              alignment: idx === 1 || idx === 3 || idx === 4 || idx === 8 ? AlignmentType.LEFT : AlignmentType.CENTER,
              children: [new TextRun({ text: cellText, size: 17 })]
            })
          ],
          shading: { fill: counter % 2 === 0 ? 'F8FAFC' : 'FFFFFF' }
        }))
      })
    );
  });

  dtList.forEach(item => {
    tableRows.push(
      new TableRow({
        children: [
          String(counter++),
          item.tanggal || '-',
          item.shift || '-',
          item.model_unit || 'Dump Truck',
          item.unit_code || '-',
          String(Number(item.hm_awal || 0).toFixed(1)),
          String(Number(item.hm_akhir || 0).toFixed(1)),
          String(Number(item.total_hm || 0).toFixed(1)),
          `${item.nama_opt || '-'} (${item.total_ritase || 0} Rit)`
        ].map((cellText, idx) => new TableCell({
          children: [
            new Paragraph({
              alignment: idx === 1 || idx === 3 || idx === 4 || idx === 8 ? AlignmentType.LEFT : AlignmentType.CENTER,
              children: [new TextRun({ text: cellText, size: 17 })]
            })
          ],
          shading: { fill: counter % 2 === 0 ? 'F8FAFC' : 'FFFFFF' }
        }))
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Kop Dokumen
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'PT. LAZ COAL MANDIRI',
                bold: true,
                size: 28,
                color: '1E3A8A'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'SITE ARUTMIN INDONESIA - KINTAP, KALIMANTAN SELATAN',
                bold: true,
                size: 20,
                color: 'D97706'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'LAPORAN REKAPITULASI DATABASE HM UNIT & RITASE HARIAN',
                bold: true,
                size: 22,
                color: '1E293B'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Tanggal Laporan: ${filterDate || new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`,
                italics: true,
                size: 18,
                color: '64748B'
              })
            ]
          }),

          // Tabel Rekap
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
          }),

          // Ruang Tanda Tangan
          new Paragraph({
            spacing: { before: 400 },
            children: []
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Dibuat Oleh,', size: 18 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Operator / Driver', bold: true, size: 18 })] }),
                      new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '( ........................................ )', size: 18 })] })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Diperiksa Oleh,', size: 18 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Pengawas Lapangan', bold: true, size: 18 })] }),
                      new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '( ........................................ )', size: 18 })] })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Disetujui Oleh,', size: 18 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Admin / Site Manager', bold: true, size: 18 })] }),
                      new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '( ........................................ )', size: 18 })] })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  // Download blob
  const blob = await Packer.toBlob(doc);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Laporan_LCM_TimeSheet_${filterDate || 'Harian'}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
