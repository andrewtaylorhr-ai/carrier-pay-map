import XLSX from "xlsx";

const path = process.argv[2];
const wb = XLSX.readFile(path);
console.log("Sheet names:", wb.SheetNames);
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  console.log(`--- Sheet: ${name} rows: ${json.length} ---`);
  json.slice(0, 10).forEach((r, i) => console.log(i, JSON.stringify(r)));
}
