# ASCII Studio (Art Studio)

[![Open Live Site](https://img.shields.io/badge/🌐%20Live%20Site-Open%20Now-22c55e?style=for-the-badge)](https://mertcan-alan.github.io/art-studio/)

Modern bir **ASCII Art** üretim aracı. Görsel yükleyip ASCII’ye çevirebilir, canvas üzerinde çizebilir ve artık **Text (Yazı) aracı** ile tuvale metin ekleyip sürükleyerek konumlandırabilirsin.

## Canlı siteye erişim

- **Live Site**: `https://mertcan-alan.github.io/art-studio/`

Yukarıdaki yeşil butona tıklayarak direkt açabilirsin.

## Özellikler

- **Görsel → ASCII**: Yüklediğin görseli ASCII çıktısına dönüştürme
- **Canvas çizim araçları**: Fırça, silgi, çizgi, dikdörtgen, elips, dolgu
- **Text aracı**:
  - Text’i seç → canvas’a tıkla → yaz → **Enter** ile yerleştir
  - Yazıyı tıkla → **sürükle-bırak** ile konumlandır
  - **Undo/Redo** destekli
- **Export**: ASCII çıktısını dışa aktarma (uygulamadaki Export panelinden)

## Teknoloji

- **Vite + React + TypeScript**
- **Tailwind CSS**
- **GitHub Pages** (GitHub Actions ile otomatik deploy)

## Projeyi yerelde çalıştırma

Ön koşul: **Node.js 20+** önerilir.

```bash
npm install
npm run dev
```

Sonra tarayıcıdan Vite’ın verdiği adresi aç (genelde `http://localhost:5173`).

## Production build alma

```bash
npm run build
npm run preview
```

`preview` ile build çıktısını yerelde test edebilirsin.

## GitHub Pages’e deploy (otomatik)

Bu repo **GitHub Actions** ile `main` branch’ine her push’ta otomatik deploy olur.

1. Repo → **Settings → Pages**
2. **Build and deployment → Source**: **GitHub Actions**
3. `main`’e push at → Actions workflow çalışır → site güncellenir

Not: GitHub Pages repo alt dizininde çalıştığı için Vite’ta `base` değeri repo adına göre ayarlanmıştır:

- Repo: `art-studio`
- Base path: `/art-studio/`

## Katkı

PR ve issue açabilirsin:
- Feature isteği: Issue
- Hata düzeltme/iyileştirme: PR

