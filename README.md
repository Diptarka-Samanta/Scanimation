# 🎞️ Scanimation Studio 🪄

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-AI_Gen-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **Bring static prints to life!** An AI-powered, full-featured web application for creating, simulating, and printing physical **Scanimation** (Barrier-Grid / Kinegram) optical illusion animations.

---

## ✨ Features

- 🤖 **AI-Powered Frame Generation**: Generate sequential animation frames from natural text prompts powered by **Google Gemini API**.
- 🎬 **Real-Time Interactive Viewer**: Drag or auto-play the transparent grating overlay over composite images to see smooth optical motion in real time.
- 🖨️ **Print & DIY Studio**: Generate high-resolution printable templates for physical paper + transparency overlay creations.
- 📤 **Direct Scanimation Decoder**: Upload existing interlaced images or sequence frames to extract and inspect layers.
- 💾 **Save & Station Storage**: Save your custom optical illusions, manage projects, and export print-ready PNG/SVG assets.
- ⚡ **High Performance & Modern UI**: Built with React 19, Vite, Tailwind CSS v4, Motion, and Express.

---

## 🎨 How Scanimation (Kinegram) Works

Scanimation (also known as *barrier-grid animation* or *kinegram*) is an optical illusion technology created by interlacing $N$ distinct animation frames into a single image strip pattern.

1. **Frame Interlacing**: Given $N$ frames, each image is sliced into vertical columns of width $W$. Column $i$ of Frame 1 is placed, followed by Column $i$ of Frame 2, through Frame $N$.
2. **Grating Overlay**: A transparent sheet printed with opaque black bars of width $(N - 1) \times W$ and transparent slits of width $W$ is overlaid on top.
3. **Motion Illusion**: As the grating sheet slides horizontally across the composite image, only one frame is visible at any given moment. Moving the sheet rapidly creates the illusion of continuous motion!

$$\text{Grating Pitch} = N \times W \quad \Big| \quad \text{Slit Width} = W \quad \Big| \quad \text{Bar Width} = (N - 1) \times W$$

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6, Motion (Framer Motion) |
| **Styling** | Tailwind CSS v4, Lucide Icons |
| **AI Integration** | Google Gemini API (`@google/genai`) |
| **Backend** | Node.js, Express 4, `tsx` |
| **Bundling & Build** | Vite, `esbuild` |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn` / `pnpm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DiptarkaSamanta/Scanimation.git
   cd Scanimation
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   PORT=3000
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to launch the studio!

---

## 📜 Available Scripts

- `npm run dev` – Launch the backend server & Vite development environment
- `npm run build` – Build client assets with Vite and bundle `server.ts` with `esbuild`
- `npm run start` – Run the production build server
- `npm run lint` – Run TypeScript type checking (`tsc --noEmit`)

---

## 📂 Project Structure

```text
scanimation/
├── public/                 # Static assets & public resources
├── src/
│   ├── components/         # React components
│   │   ├── AiGeneratorModal.tsx       # AI prompt modal for Gemini frame generation
│   │   ├── DirectScanimationUploader.tsx # Interlaced image decoder & builder
│   │   ├── FrameUploader.tsx          # Multi-frame image uploader
│   │   ├── Header.tsx                 # Navigation & top banner
│   │   ├── InfoModal.tsx              # Optical illusion science guide
│   │   ├── PrintModal.tsx             # Print & export studio configuration
│   │   ├── SaveScanimationModal.tsx   # Project saving & metadata
│   │   ├── SaveStationModal.tsx       # Saved projects gallery
│   │   └── ScanimationViewer.tsx      # Real-time optical illusion player & grid overlay
│   ├── utils/              # Canvas interlacers & processing utilities
│   ├── App.tsx             # Main application container
│   ├── main.tsx            # React entry point
│   ├── types.ts            # TypeScript interfaces & types
│   └── index.css           # Global styles & Tailwind configuration
├── server.ts               # Express backend API & static server
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Scripts & dependencies
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are always welcome!  
Feel free to check out the [issues page](https://github.com/DiptarkaSamanta/Scanimation/issues).

---

## 👤 Author

**Diptarka Samanta**
- GitHub: [@DiptarkaSamanta](https://github.com/DiptarkaSamanta)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
