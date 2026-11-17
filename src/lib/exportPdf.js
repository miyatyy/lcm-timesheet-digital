import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper Format Kop Surat
const drawHeader = (doc, title, subtitle = 'SITE ARUTMIN INDONESIA - KINTAP, KALIMANTAN SELATAN') => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Royal Blue Top Stripe
  doc.setFillColor(30, 58, 138); // #1E3A8A
  doc.rect(0, 0, pageWidth, 18, 'F');

  // Gold accent line
  doc.setFillColor(245, 158, 11); // #F59E0B
  doc.rect(0, 18, pageWidth, 2, 'F');

  // Title in stripe
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PT. LAZ COAL MANDIRI', 14, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 15.5);

  // Document Title
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 28, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Dicetak dari Sistem LCM TimeSheet Digital', pageWidth / 2, 33, { align: 'center' });

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 36, pageWidth - 14, 36);
};

// Helper Format Tanda Tangan 3 Kolom
const drawSignatures = (doc, startY, optName = '', pengawas = '', office = '') => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = 52;
  const col1 = 14;
  const col2 = (pageWidth - boxWidth) / 2;
  const col3 = pageWidth - 14 - boxWidth;

  const y = startY > 240 ? 245 : startY;

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  // Box 1: Operator / Driver
  doc.setFont('helvetica', 'bold');
  doc.text('Operator / Driver', col1 + boxWidth / 2, y, { align: 'center' });
  doc.line(col1, y + 22, col1 + boxWidth, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(optName || '( .................................... )', col1 + boxWidth / 2, y + 26, { align: 'center' });

  // Box 2: Pengawas Lapangan
  doc.setFont('helvetica', 'bold');
  doc.text('Pengawas Lapangan', col2 + boxWidth / 2, y, { align: 'center' });
  doc.line(col2, y + 22, col2 + boxWidth, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(pengawas || '( .................................... )', col2 + boxWidth / 2, y + 26, { align: 'center' });

  // Box 3: Office / Admin Site
  doc.setFont('helvetica', 'bold');
  doc.text('Admin / Office Site', col3 + boxWidth / 2, y, { align: 'center' });
  doc.line(col3, y + 22, col3 + boxWidth, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(office || '( .................................... )', col3 + boxWidth / 2, y + 26, { align: 'center' });
};

/**
 * 1. PRINT OUT PDF HARIAN: TIME SHEET ALAT BERAT
 */
export const printHEDailyPDF = (record) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  drawHeader(doc, 'LEMBAR TIME SHEET ALAT BERAT (HEAVY EQUIPMENT)');

  // Info Box Header Grid
  const leftX = 14;
  const rightX = 110;
  let topY = 42;

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  // Kolom Kiri
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal:', leftX, topY);
  doc.setFont('helvetica', 'normal');
  doc.text(record.tanggal || '-', leftX + 32, topY);

  doc.setFont('helvetica', 'bold');
  doc.text('Shift Kerja:', leftX, topY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(record.shift || '-', leftX + 32, topY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Nama Operator:', leftX, topY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${record.nama_opt || '-'} (NIK: ${record.nik || '-'})`, leftX + 32, topY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Model Unit:', leftX, topY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(record.model_unit || '-', leftX + 32, topY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('No Unit / Code:', leftX, topY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(record.unit_code || '-', leftX + 32, topY + 24);
  doc.setTextColor(15, 23, 42);

  // Kolom Kanan (HM & Jam Kerja)
  doc.setFont('helvetica', 'bold');
  doc.text('HM Awal:', rightX, topY);
  doc.setFont('helvetica', 'normal');
  doc.text(Number(record.hm_awal || 0).toFixed(2), rightX + 36, topY);

  doc.setFont('helvetica', 'bold');
  doc.text('HM Akhir:', rightX, topY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(Number(record.hm_akhir || 0).toFixed(2), rightX + 36, topY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Total HM Unit:', rightX, topY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`${Number(record.total_hm || 0).toFixed(2)} Jam`, rightX + 36, topY + 12);
  doc.setTextColor(15, 23, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Jam Kerja Unit:', rightX, topY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Number(record.jam_kerja_unit || 0).toFixed(2)} Jam`, rightX + 36, topY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Jam Kerja MP:', rightX, topY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Number(record.jam_kerja_mp || 0).toFixed(2)} Jam`, rightX + 36, topY + 24);

  // Tabel Jam Kerja (WH)
  const whRows = (record.wh_logs || []).map((row, idx) => [
    idx + 1,
    row.time || '-',
    row.kegiatan || '-',
    row.keterangan || '-',
    row.check_hour ? '✔ Aktif' : 'Standby / Off'
  ]);

  autoTable(doc, {
    startY: topY + 30,
    head: [['No', 'Jam Kerja (WH)', 'Uraian Kegiatan Operasi', 'Keterangan Lokasi / Job', 'Check Hour']],
    body: whRows.length > 0 ? whRows : [['1', '06:00-18:00', 'Operasi Normal', '-', '✔']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: 'center',
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 26 },
      2: { cellWidth: 55 },
      3: { cellWidth: 65 },
      4: { halign: 'center', cellWidth: 26 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = doc.lastAutoTable.finalY + 14;
  drawSignatures(doc, finalY, record.nama_opt, record.pengawas, record.office);

  // Trigger Save / Open
  doc.save(`TimeSheet_HE_${record.unit_code || 'Unit'}_${record.tanggal || 'HariIni'}.pdf`);
};

/**
 * 2. PRINT OUT PDF HARIAN: TIME SHEET DUMP TRUCK
 */
export const printDTDailyPDF = (record) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  drawHeader(doc, 'LEMBAR TIME SHEET DUMP TRUCK (DT)');

  // Info Header Grid
  const leftX = 14;
  const rightX = 110;
  let topY = 42;

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  // Kolom Kiri
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal:', leftX, topY);
  doc.setFont('helvetica', 'normal');
  doc.text(record.tanggal || '-', leftX + 32, topY);

  doc.setFont('helvetica', 'bold');
  doc.text('Shift / Pergantian:', leftX, topY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${record.shift || '-'} (Shift ${record.pergantian || 'I'})`, leftX + 32, topY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Nama Driver:', leftX, topY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${record.nama_opt || '-'} (NIK: ${record.nik || '-'})`, leftX + 32, topY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Model Unit:', leftX, topY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(record.model_unit || 'Hino 500 FM 260 JD', leftX + 32, topY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Unit Code:', leftX, topY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(record.unit_code || '-', leftX + 32, topY + 24);
  doc.setTextColor(15, 23, 42);

  // Kolom Kanan (HM & Ritase)
  doc.setFont('helvetica', 'bold');
  doc.text('HM Awal:', rightX, topY);
  doc.setFont('helvetica', 'normal');
  doc.text(Number(record.hm_awal || 0).toFixed(2), rightX + 36, topY);

  doc.setFont('helvetica', 'bold');
  doc.text('HM Akhir:', rightX, topY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(Number(record.hm_akhir || 0).toFixed(2), rightX + 36, topY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Total HM Unit:', rightX, topY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`${Number(record.total_hm || 0).toFixed(2)} Jam`, rightX + 36, topY + 12);
  doc.setTextColor(15, 23, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Jam Kerja Unit / MP:', rightX, topY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Number(record.jam_kerja_unit || 0).toFixed(1)} / ${Number(record.jam_kerja_mp || 0).toFixed(1)} Jam`, rightX + 36, topY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Ritase:', rightX, topY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text(`${record.total_ritase || 0} Rit`, rightX + 36, topY + 24);
  doc.setTextColor(15, 23, 42);

  // Tabel Jam Kerja (WH)
  const whRows = (record.wh_logs || []).map((row, idx) => [
    idx + 1,
    row.time || '-',
    row.kegiatan || '-',
    row.keterangan || '-',
    row.check_hour ? '✔ Aktif' : 'Standby / Off'
  ]);

  autoTable(doc, {
    startY: topY + 30,
    head: [['No', 'Jam Kerja (WH)', 'Uraian Kegiatan Hauling', 'Keterangan / Rute', 'Check']],
    body: whRows.length > 0 ? whRows : [['1', '06:00-18:00', 'Hauling OB / Batubara', '-', '✔']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      halign: 'center',
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 26 },
      2: { cellWidth: 60 },
      3: { cellWidth: 65 },
      4: { halign: 'center', cellWidth: 20 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // Tabel Ritase Unit
  let afterWH = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('REKAPITULASI RITASE PER JAM:', 14, afterWH);

  const ritaseRows = (record.ritase_logs || []).map(r => [
    r.time || '-',
    r.ex_code || '-',
    `${r.count || 0} Rit`
  ]);

  autoTable(doc, {
    startY: afterWH + 2,
    head: [['Jam', 'Kode Ex Pemuat', 'Ritase']],
    body: ritaseRows.length > 0 ? ritaseRows : [['07-18', 'EX-623', `${record.total_ritase || 0} Rit`]],
    foot: [['TOTAL RITASE', '', `${record.total_ritase || 0} Rit`]],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7,
      halign: 'center'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 58, 138],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    styles: {
      fontSize: 6.5,
      cellPadding: 1.2,
      halign: 'center'
    }
  });

  const finalY = doc.lastAutoTable.finalY + 12;
  drawSignatures(doc, finalY, record.nama_opt, record.pengawas, record.office);

  doc.save(`TimeSheet_DT_${record.unit_code || 'Unit'}_${record.tanggal || 'HariIni'}.pdf`);
};

/**
 * 3. AUTO-BACKUP PDF BULANAN (REKAP SEMUA LAPORAN BULAN LALU)
 */
export const exportMonthlyBackupPDF = (heList = [], dtList = [], monthLabel = '') => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const currentMonth = monthLabel || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  drawHeader(doc, `LAPORAN REKAPITULASI BULANAN & AUTO-BACKUP: ${currentMonth.toUpperCase()}`);

  // Summary Cards
  const totalHEHM = heList.reduce((acc, cur) => acc + Number(cur.total_hm || 0), 0);
  const totalDTHM = dtList.reduce((acc, cur) => acc + Number(cur.total_hm || 0), 0);
  const totalRitase = dtList.reduce((acc, cur) => acc + Number(cur.total_ritase || 0), 0);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Laporan HE: ${heList.length} Lembar | Total HM HE: ${totalHEHM.toFixed(2)} Jam`, 14, 42);
  doc.text(`Total Laporan DT: ${dtList.length} Lembar | Total HM DT: ${totalDTHM.toFixed(2)} Jam | Total Ritase: ${totalRitase} Rit`, 14, 47);

  // Table 1: HE Timesheets
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(9);
  doc.text('DAFTAR LEMBAR KERJA ALAT BERAT (HE)', 14, 54);

  const heTableData = heList.map((r, i) => [
    i + 1,
    r.tanggal || '-',
    r.shift || '-',
    r.model_unit || '-',
    r.unit_code || '-',
    Number(r.hm_awal || 0).toFixed(1),
    Number(r.hm_akhir || 0).toFixed(1),
    Number(r.total_hm || 0).toFixed(1),
    r.nama_opt || '-',
    r.pengawas || '-'
  ]);

  autoTable(doc, {
    startY: 56,
    head: [['No', 'Tanggal', 'Shift', 'Model Unit', 'No Unit', 'HM Awal', 'HM Akhir', 'Total HM', 'Operator', 'Pengawas']],
    body: heTableData.length > 0 ? heTableData : [['-', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      fontSize: 7.5,
      halign: 'center'
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      halign: 'center'
    }
  });

  // Table 2: DT Timesheets
  let nextY = doc.lastAutoTable.finalY + 8;
  if (nextY > 175) {
    doc.addPage();
    drawHeader(doc, `LAPORAN REKAPITULASI DUMP TRUCK: ${currentMonth.toUpperCase()}`);
    nextY = 44;
  }

  doc.setTextColor(30, 58, 138);
  doc.setFontSize(9);
  doc.text('DAFTAR LEMBAR KERJA DUMP TRUCK (DT)', 14, nextY);

  const dtTableData = dtList.map((r, i) => [
    i + 1,
    r.tanggal || '-',
    `${r.shift} (Shift ${r.pergantian})`,
    r.unit_code || '-',
    r.model_unit || '-',
    Number(r.hm_awal || 0).toFixed(1),
    Number(r.hm_akhir || 0).toFixed(1),
    Number(r.total_hm || 0).toFixed(1),
    `${r.total_ritase || 0} Rit`,
    r.nama_opt || '-'
  ]);

  autoTable(doc, {
    startY: nextY + 2,
    head: [['No', 'Tanggal', 'Shift', 'Unit Code', 'Model Unit', 'HM Awal', 'HM Akhir', 'Total HM', 'Ritase', 'Driver']],
    body: dtTableData.length > 0 ? dtTableData : [['-', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      fontSize: 7.5,
      halign: 'center'
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      halign: 'center'
    }
  });

  const fileName = `LCM_AutoBackup_${currentMonth.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  return fileName;
};
