---
name: token-saver
description: "Hemat token ekstrim dengan baca selektif, ringkas konteks, dan delegasi cerdas untuk file besar"
---

# Token Saver

Skill penghemat token. Tujuan: selesaikan tugas dengan token seminimal mungkin tanpa mengorbankan akurasi.

## What I do

- **Baca selektif**: Selalu `Grep`/`Glob` dulu sebelum `Read`. `Read` hanya 30-50 baris relevan dengan `offset/limit`, bukan full file.
- **Ringkas file raksasa**: `src/script.js` (~2000+ baris) dan `index.html` (~900 baris) jangan pernah di-read sekaligus. Ambil summary via `bash` + `Grep` atau via `Task` explore agent.
- **Delegasi**: Untuk eksplorasi luas, pakai `Task` subagent (`explore` type: quick/medium) agar konteks utama tetap ramping.
- **Cache & reuse**: Simpan hasil `Grep`/`Read` penting, jangan baca ulang `I18N` di `index.html:446` atau `style.css:1` variables berulang kali.
- **Output padat**: Jawaban singkat, to-the-point, hindari pengulangan. Pakai `file_path:line_number` bukan kutip panjang.

## When to use me

Aktif saat: konteks sudah panjang, file >500 baris, user bilang "hemat token", "irit token", "token mahal", atau saat agent mulai melebihi 20 tool calls.

## Workflow

1.  **Triage**: Apakah butuh full file? 90% tidak. Gunakan `Grep pattern="function handleFile" include="*.js"` dulu.
2.  **Slice**: Jika butuh Read, tentukan `offset` presisi (mis: `Read src/script.js offset=564 limit=35` untuk `handleFileSelected`).
3.  **Delegate**: Jika butuh cari di banyak file, `Task(description="cari logic compress", prompt="...")` biar subagent yang boros token, bukan main agent.
4.  **Summarize**: Setelah baca, ringkas jadi 2-3 baris sebelum lanjut ke step berikutnya.

## Rules

- DILARANG `Read` tanpa `Grep`/`Glob` pendahulu untuk file >300 baris.
- DILARANG copy-paste blok kode >20 baris ke output chat - ringkas saja.
- Selalu prefer `bash: grep -n` atau `Grep` tool untuk hitung/lokasi, bukan `Read` lalu hitung manual.
- Jika user minta "hemat token", aktifkan mode strict: maksimal 3 Read per task, selebihnya via Task agent.

## Contoh Hemat

Buruk: `Read src/script.js` (2000 baris = ~15k token)
Baik: `Grep pattern="compressV3WithFfmpeg" include="*.js"` -> `Read src/script.js offset=825 limit=45` (45 baris = ~400 token) -> hemat 97%

## Integrasi VelardTools

- `index.html:26` JSON-LD, `index.html:446` I18N, `src/script.js:721` compress logic -> semua bisa di-Grep dulu dengan keyword spesifik sebelum Read.
