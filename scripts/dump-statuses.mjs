import XLSX from "xlsx";

const files = process.argv.slice(2);

for (const path of files) {
  const wb = XLSX.readFile(path);
  console.log(`\n########## ${path} ##########`);
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    if (rows.length === 0) continue;
    const headers = Object.keys(rows[0]);
    const statusCol = headers.find((h) =>
      /^status$/i.test(h.trim()) || /decision code/i.test(h) || /^update$/i.test(h.trim())
    );
    if (!statusCol) continue;
    const counts = new Map();
    for (const r of rows) {
      const v = String(r[statusCol] ?? "").trim();
      if (!v) continue;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    console.log(`--- ${sheetName} :: column "${statusCol}" ---`);
    for (const [v, c] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${c}\t${v}`);
    }
  }
}
