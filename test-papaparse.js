// test-papaparse.js

// Pastikan Anda telah menginstal papaparse: npm install papaparse
// Gunakan require jika Anda menjalankan dengan Node.js biasa
const Papa = require("papaparse");

// Atau jika Anda menggunakan modul ES (import) dan lingkungan mendukungnya:
// import Papa from 'papaparse';

const staticCsvString = `code,name
11,ACEH
12,SUMATERA UTARA
13,SUMATERA BARAT
14,RIAU`;

console.log("--- Menjalankan Tes PapaParse Mandiri ---");
console.log("String CSV yang diuji:\n", staticCsvString);

Papa.parse(staticCsvString, {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: true,
  delimiter: ",",
  complete: (results) => {
    console.log("\n--- Hasil Lengkap PapaParse ---");
    console.log("Data:", results.data);
    console.log("Meta:", results.meta);
    console.log("Errors:", results.errors);
  },
  error: (err) => {
    console.error("\n--- Error PapaParse ---");
    console.error("Terjadi kesalahan:", err);
  },
});

console.log("\nTes PapaParse mandiri sedang berjalan...");
