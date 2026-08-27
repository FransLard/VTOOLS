---
name: lazy-dev
description: "Automasi tugas malas dev - generate boilerplate, commit pintar, deploy Vercel dan obfuscate tanpa ngetik berulang"
---

# Lazy Dev

Skill untuk developer yang ingin kerja minimal tapi hasil maksimal. Automasi semua yang repetitif di VelardTools.

## What I do

- **Boilerplate generator**: Buat component HTML/CSS/JS baru dari prompt 1 kalimat (contoh: "tambah tool convert ke WebP")
- **Git malas**: `git status` + `git diff` -> auto-generate commit message conventional commits, `git log --oneline -5` untuk konteks
- **Build & Deploy 1-klik**: Jalankan `npm run obfuscate` (obfuscate.js:1), cek `vercel.json`, lalu `deploy.ps1` atau `vercel --prod`
- **File ops cepat**: Buat/edit file tanpa banyak tanya, pakai default yang waras untuk VelardTools
- **TODO extractor**: Ubah request panjang jadi checklist `TodoWrite` otomatis

## When to use me

Gunakan saat user bilang: "malas", "bikinin cepat", "automasi", "sekali jadi", "gas", "langsung jadi", atau minta fitur baru tanpa detail panjang.

## Workflow

1.  **Pahami request singkat** -> jangan tanya balik terlalu banyak, ambil default terbaik untuk VelardTools (dark theme, `style.css:1`, `index.html:114` upload-card pattern)
2.  **Generate code langsung** -> tulis/edit file yang diperlukan
3.  **Verifikasi cepat** -> jalankan `bash` cek build (mis: `node obfuscate.js` atau `python server.py`)
4.  **Git siap** -> siapkan commit message, tapi jangan push kecuali diminta

## Rules

- Prioritaskan kecepatan > kesempurnaan. Berikan solusi yang jalan dulu.
- Selalu cek file existing via `Read`/`Glob`/`Grep` sebelum tulis baru (hindari duplikasi `dash-panel` / `I18N` key).
- Untuk fitur baru Tools panel, ikuti pattern di `index.html:176` (.tool-card) dan i18n di `index.html:446`.
- Jangan minta konfirmasi berulang - langsung eksekusi kalau request jelas.

## Contoh Prompt

> "lazy, bikin tool baru buat kompres gambar"

Aku akan: buat `panel-tools` card baru, tambah i18n ID/EN, tambah handler di `src/script.js:1`, dan tes via `server.py`.
