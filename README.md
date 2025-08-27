# Chess
WeMoney Interview prep

# Visit live app
URL: https://chess-ten-sage.vercel.app/



# ♟️ Chess - Real-time Multiplayer Chess Game

A modern, full-featured chess application built with Next.js, React, and TypeScript. Play chess locally with friends or online with real-time multiplayer support.

![Chess Game](https://img.shields.io/badge/Chess-Game%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

### 🎮 Game Modes
- **Local Game (Hotseat)**: Two players on one device with advanced chess features
- **Online Multiplayer**: Real-time chess games with friends via shareable links
- **Spectator Mode**: Watch games without participating

### ♟️ Chess Features
- Full chess rules implementation using chess.js
- Visual move highlighting and path visualization
- Auto-board flipping based on current player
- Move history with algebraic notation
- Game status detection (check, checkmate, stalemate, draw)
- Legal move validation and highlighting

### 🚀 Technical Features
- Real-time game updates with efficient polling
- ETag-based caching for optimal performance
- Version-based conflict resolution
- Player persistence with local storage
- Responsive design with Tailwind CSS
- Dark mode by default

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Chess Engine**: chess.js, react-chessboard
- **State Management**: React hooks with custom services
- **Storage**: In-memory (dev) + Redis (production)
- **Testing**: Jest with TDD approach
- **Build Tool**: Turbopack for fast development

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chess.git
   cd chess
   ```

2. **Install dependencies**
   ```bash
   cd web
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables (Optional)

For production deployment with Redis persistence:

```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## 🎯 How to Play

### Local Game
1. Navigate to `/local`
2. Two players take turns on the same device
3. Use drag-and-drop or click to move pieces
4. Board automatically flips for each player's turn

### Online Game
1. Click "Create online game" from the home page
2. Share the generated link with your opponent
3. Both players join and are automatically assigned colors
4. Play in real-time with live updates

### Game Controls
- **Flip Board**: Manually rotate the chess board
- **Auto Flip**: Automatically flip board based on current player
- **Reset Game**: Start a new game from the beginning
- **Copy Link**: Share the game URL (online mode)

## 🧪 Testing

Run the test suite using Jest:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

The project follows Test-Driven Development (TDD) principles with comprehensive test coverage for:
- Chess game logic
- Game state management
- API handlers
- Move validation

## 🏗️ Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── local/             # Local game page
│   │   ├── online/[id]/       # Online game page
│   │   ├── api/               # API routes
│   │   └── components/        # Reusable UI components
│   ├── lib/                   # Core business logic
│   │   ├── ChessService.ts    # Chess game wrapper
│   │   └── utils.ts           # Utility functions
│   └── server/                # Server-side services
│       ├── api/               # API handlers
│       ├── GameService.ts     # Game lifecycle management
│       ├── GameStore.ts       # Storage abstraction
│       └── SeatStore.ts       # Player management
├── components.json            # shadcn/ui configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── package.json              # Dependencies and scripts
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run test suite
- `pnpm test:watch` - Run tests in watch mode

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables for Redis (optional)
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any Node.js hosting platform:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [chess.js](https://github.com/jhlywa/chess.js) - Chess game logic
- [react-chessboard](https://github.com/Clariity/react-chessboard) - Chess UI component
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

**Built with ♥️ for chess enthusiasts and developers**

*This project was created as part of WeMoney interview preparation.*
