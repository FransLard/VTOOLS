---
name: ui-frontend
description: "Asisten UI/Frontend VelardTools - audit dan perbaiki style.css, komponen dashboard, responsive dan design system"
---

# UI Frontend

Skill khusus untuk semua urusan UI/Frontend VelardTools. Fokus: `style.css:1`, `index.html:64` layout, dan design system.

## What I do

- **Audit design system**: Cek `:root` variables `style.css:1` (--md-sys-color-*, --md-radius), pastikan konsisten dark theme `#0b0c0e`/`#121417`
- **Komponen dashboard**: Perbaiki `app-container` (`style.css:666`), `dash-side` (`style.css:679`), `dash-panel` (`style.css:75`), `upload-card` (`style.css:111`), `segmented` (`style.css:220`)
- **Responsive & a11y**: Fix `@media (max-width: 768px)` (`style.css:817`), focus-visible (`style.css:141`), contrast, `aria-label` di `index.html:117`
- **Reusable pattern**: Ikuti pattern card/modal yang sudah ada: `.card` (`style.css:103`), `.modal` (`style.css:409`), `.tool-card` (`style.css:1277`), `.tutorial-step` (`style.css:846`)
- **Typography**: Jaga font `Plus Jakarta Sans`/`Inter`/`JetBrains Mono` (`style.css:18`, `style.css:363`), Material Symbols Rounded

## When to use me

Gunakan saat user minta: "UI", "frontend", "tampilan", "desain", "responsive", "styling", "perbaiki CSS", "bikin komponen", atau "audit tampilan".

## Workflow

1.  **Inspect**: `Read style.css` seperlunya + `Grep` class yang diminta, cek `index.html` struktur panel (`panel-quality`, `panel-tools`, `panel-tutorial`, `panel-donate`, `panel-tentang`)
2.  **Propose**: Beri 1-2 opsi visual (sebelum/sesudah) dengan perubahan minimal - jangan overhaul total kecuali diminta
3.  **Edit surgical**: `Edit` hanya baris yang perlu di `style.css` atau `index.html`, jaga `box-shadow`, `border-radius: 16px`, dan `gap: 24px` yang khas VelardTools
4.  **Test**: Sarankan cek via `python server.py` atau `Read` ulang bagian yang diedit, pastikan tidak merusak `dash-nav` grid di mobile

## Rules

- Jangan ubah palet warna utama tanpa izin - VelardTools identitasnya dark minimalis.
- Selalu pertahankan `border: 1px solid rgba(255,255,255,0.1)` dan `box-shadow` yang sudah ada.
- Untuk komponen baru, duplikasi style dari `.tool-card` atau `.tutorial-card`, jangan bikin sistem baru.
- Pastikan semua `button` punya `font-family: inherit` dan `cursor: pointer` (`style.css:43`).
- I18n: Jika tambah teks UI baru, tambah key di `I18N` `index.html:446` untuk ID dan EN.

## Contoh

> "bikin Tools card ke-5 lebih bagus"
Aku akan: cek `index.html:192` grid, perbaiki `style.css:1277` gap/padding, pastikan `coming-soon` konsisten, dan test responsive.

## Checklist

- [ ] Variabel `:root` tidak duplikat
- [ ] Hidden panel pakai `[hidden] { display:none !important }` (`style.css:81`)
- [ ] Hover/active state ada (`:hover`, `.active`)
- [ ] Mobile grid tidak pecah
