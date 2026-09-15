# Security Policy — VelardTools

## Melapor celah keamanan

Temukan bug keamanan di [velardtools.my.id](https://velardtools.my.id)?

1. **Jangan** publikasikan sebelum diperbaiki.
2. Laporkan lewat tombol **Laporkan Bug / Bantuan** di web (panel Lainnya), atau DM TikTok [@ve1ard](https://www.tiktok.com/@ve1ard).
3. Sertakan: URL terdampak, langkah reproduksi, dan dampak yang kamu lihat.

Kami menargetkan respons awal dalam 1×24 jam.

## Cakupan

- `https://velardtools.my.id/` (frontend statis + tools berbasis browser)
- File di repo ini (`index.html`, `assets/`, `src/`)

Di luar cakupan: EmailJS/ Vercel/ CDN pihak ketiga (laporkan ke penyedia masing-masing),
serangan DoS bervolume, dan rekayasa sosial.

## Praktik yang sudah diterapkan

- Content-Security-Policy ketat + `upgrade-insecure-requests`
- `X-Frame-Options: DENY` + `frame-ancestors 'none'` (anti-clickjacking)
- HSTS preload, `nosniff`, COOP/COEP/CORP
- Semua pemrosesan file 100% lokal di browser — tidak ada upload ke server
- Secret (`.env*`) tidak pernah di-commit; `assets/js/app.js` adalah artefak build
- Rate-limit + honeypot pada formulir bantuan

## Riwayat

- 2026-09-14: audit XSS/DOM internal — nama file user lolos via `textContent`/`escapeHtml`;
  ditambahkan allowlist protokol URL, penghapusan pola `javascript:`, dan escaping string i18n.
