import * as XLSX from 'xlsx';

/**
 * Export Database HM Unit to Excel (.xlsx)
 * Kolom Sesuai Spesifikasi:
 * Date | Shift | Model Unit | No Unit | HM Awal | HM Akhir | Total HM | Operator 1 | HM Opt 1 | Operator 2 | HM Opt 2 | Operator 3 | HM Opt 3
 */
export const exportDatabaseHMToExcel = (heList = [], dtList = [], filterDate = '') => {
  // 1. Data Sheet: DATABASE HM UNIT
  const hmUnitRows = [];

  // Grouping by Unit Code & Tanggal & Shift
  const unitGroupMap = {};

  // Process HE List
  heList.forEach(item => {
    const key = `${item.tanggal}_${item.shift}_${item.unit_code}`;
    if (!unitGroupMap[key]) {
      unitGroupMap[key] = {
        date: item.tanggal,
        shift: item.shift,
        modelUnit: item.model_unit,
        noUnit: item.unit_code,
        hmAwal: Number(item.hm_awal || 0),
        hmAkhir: Number(item.hm_akhir || 0),
        totalHm: Number(item.total_hm || 0),
        operators: [
          { name: item.nama_opt, hm: Number(item.total_hm || 0) }
        ]
      };
    } else {
      unitGroupMap[key].hmAwal = Math.min(unitGroupMap[key].hmAwal, Number(item.hm_awal || 0));
      unitGroupMap[key].hmAkhir = Math.max(unitGroupMap[key].hmAkhir, Number(item.hm_akhir || 0));
      unitGroupMap[key].totalHm = unitGroupMap[key].hmAkhir - unitGroupMap[key].hmAwal;
      unitGroupMap[key].operators.push({ name: item.nama_opt, hm: Number(item.total_hm || 0) });
    }
  });

  // Process DT List (juga dimasukkan ke database unit)
  dtList.forEach(item => {
    const key = `${item.tanggal}_${item.shift}_${item.unit_code}`;
    if (!unitGroupMap[key]) {
      unitGroupMap[key] = {
        date: item.tanggal,
        shift: item.shift,
        modelUnit: item.model_unit || 'Hino 500',
        noUnit: item.unit_code,
        hmAwal: Number(item.hm_awal || 0),
        hmAkhir: Number(item.hm_akhir || 0),
        totalHm: Number(item.total_hm || 0),
        operators: [
          { name: item.nama_opt, hm: Number(item.total_hm || 0) }
        ]
      };
    } else {
      unitGroupMap[key].hmAwal = Math.min(unitGroupMap[key].hmAwal, Number(item.hm_awal || 0));
      unitGroupMap[key].hmAkhir = Math.max(unitGroupMap[key].hmAkhir, Number(item.hm_akhir || 0));
      unitGroupMap[key].totalHm = unitGroupMap[key].hmAkhir - unitGroupMap[key].hmAwal;
      unitGroupMap[key].operators.push({ name: item.nama_opt, hm: Number(item.total_hm || 0) });
    }
  });

  // Format ke baris Excel
  Object.values(unitGroupMap).forEach(g => {
    const opt1 = g.operators[0] || { name: '-', hm: 0 };
    const opt2 = g.operators[1] || { name: '-', hm: 0 };
    const opt3 = g.operators[2] || { name: '-', hm: 0 };

    hmUnitRows.push({
      'Date': g.date,
      'Shift': g.shift,
      'Model Unit': g.modelUnit,
      'No Unit': g.noUnit,
      'HM Awal': g.hmAwal,
      'HM Akhir': g.hmAkhir,
      'Total HM': Number(g.totalHm.toFixed(2)),
      'Operator 1': opt1.name,
      'HM Opt 1': opt1.hm,
      'Operator 2': opt2.name,
      'HM Opt 2': opt2.hm,
      'Operator 3': opt3.name,
      'HM Opt 3': opt3.hm
    });
  });

  // 2. Data Sheet: REKAP RITASE DUMP TRUCK
  const dtRows = dtList.map((dt, idx) => ({
    'No': idx + 1,
    'Tanggal': dt.tanggal,
    'Shift': dt.shift,
    'Pergantian': dt.pergantian,
    'No Unit DT': dt.unit_code,
    'Driver': dt.nama_opt,
    'NIK': dt.nik,
    'HM Awal': dt.hm_awal,
    'HM Akhir': dt.hm_akhir,
    'Total HM': dt.total_hm,
    'Total Ritase': dt.total_ritase,
    'Pengawas': dt.pengawas,
    'Office': dt.office
  }));

  // Buat WorkBook
  const wb = XLSX.utils.book_new();

  // Sheet 1: DATABASE HM UNIT
  const wsHM = XLSX.utils.json_to_sheet(hmUnitRows.length > 0 ? hmUnitRows : [{
    'Date': '-', 'Shift': '-', 'Model Unit': '-', 'No Unit': '-',
    'HM Awal': 0, 'HM Akhir': 0, 'Total HM': 0,
    'Operator 1': '-', 'HM Opt 1': 0,
    'Operator 2': '-', 'HM Opt 2': 0,
    'Operator 3': '-', 'HM Opt 3': 0
  }]);

  // Set Column Widths
  wsHM['!cols'] = [
    { wch: 12 }, // Date
    { wch: 16 }, // Shift
    { wch: 18 }, // Model Unit
    { wch: 12 }, // No Unit
    { wch: 10 }, // HM Awal
    { wch: 10 }, // HM Akhir
    { wch: 10 }, // Total HM
    { wch: 22 }, // Operator 1
    { wch: 10 }, // HM Opt 1
    { wch: 22 }, // Operator 2
    { wch: 10 }, // HM Opt 2
    { wch: 22 }, // Operator 3
    { wch: 10 }  // HM Opt 3
  ];

  XLSX.utils.book_append_sheet(wb, wsHM, 'DATABASE HM UNIT');

  // Sheet 2: REKAP DUMP TRUCK
  if (dtRows.length > 0) {
    const wsDT = XLSX.utils.json_to_sheet(dtRows);
    wsDT['!cols'] = [
      { wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
      { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 18 }, { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDT, 'REKAP DUMP TRUCK');
  }

  // Unduh File
  const fileDate = filterDate || new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `DATABASE_HM_UNIT_LCM_${fileDate}.xlsx`);
};
