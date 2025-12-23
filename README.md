# Commune - Token-Gated Community Platform

A modern, minimal, and visually elegant website for token-gated community interaction featuring real-time text chat and group video calls.

![Commune Preview](./preview.png)

## ✨ Features

- **🔐 Token-Gated Access** - Only verified token holders can access the community
- **💬 Real-time Chat** - Instant messaging with emojis and reactions
- **📹 Video Calls** - High-quality group video with WebRTC
- **👛 Wallet Integration** - Connect with MetaMask, WalletConnect, and more
- **🎨 Modern UI** - Clean, minimal design with smooth animations
- **📱 Responsive** - Works beautifully on desktop and mobile
- **🌙 Dark Theme** - Easy on the eyes, perfect for long sessions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A WalletConnect Project ID (get one at [cloud.walletconnect.com](https://cloud.walletconnect.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/token-gated-community.git
   cd token-gated-community
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
   VITE_TOKEN_CONTRACT_ADDRESS=0x...
   VITE_REQUIRED_TOKEN_AMOUNT=100
   ```

4. **Update token configuration**
   
   Edit `src/config/web3.js` with your token details:
   ```javascript
   export const TOKEN_CONFIG = {
     name: 'Your Token Name',
     symbol: 'TKN',
     requiredAmount: 100,
     decimals: 18,
     addresses: {
       1: '0x...', // Ethereum Mainnet
       137: '0x...', // Polygon
     },
   };
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
token-gated-community/
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # Main application component
    ├── index.css          # Global styles and animations
    ├── config/
    │   └── web3.js        # Web3 configuration and ABIs
    └── hooks/
        └── useWeb3.js     # Custom React hooks for Web3
```

## 🎨 Design System

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0a0a0f` | Main background |
| Amber 400 | `#fbbf24` | Primary accent |
| Orange 500 | `#f97316` | Secondary accent |
| White | Various opacities | Text and borders |

### Typography

- **Display**: Outfit (600-700 weight)
- **Body**: Outfit (400-500 weight)
- **Monospace**: JetBrains Mono

### Components

The UI is built with reusable components:
- `Button` - Multiple variants (primary, secondary, ghost, danger)
- `Card` - Glass morphism container
- `Badge` - Status indicators
- `Avatar` - User avatars with status
- `Spinner` - Loading indicator

## 🔧 Configuration

### Token Requirements

Edit `src/config/web3.js` to configure:

```javascript
export const TOKEN_CONFIG = {
  name: 'Community Token',
  symbol: 'COMM',
  requiredAmount: 100,    // Minimum tokens required
  decimals: 18,           // Token decimals
  addresses: {
    1: '0x...',          // Mainnet contract
    137: '0x...',        // Polygon contract
  },
};
```

### Supported Chains

By default, the app supports:
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism

Add more chains in `src/config/web3.js`.

## 🔌 Backend Integration

### Real-time Chat

For production, integrate with a WebSocket server:

```javascript
// src/hooks/useWeb3.js
import { io } from 'socket.io-client';

const socket = io('wss://your-server.com');

socket.on('message', (message) => {
  setMessages((prev) => [...prev, message]);
});

socket.emit('message', newMessage);
```

### Video Calls

Recommended video providers:

1. **Daily.co** (Recommended)
   ```javascript
   import DailyIframe from '@daily-co/daily-js';
   
   const call = DailyIframe.createFrame();
   call.join({ url: 'https://your-domain.daily.co/room-name' });
   ```

2. **Twilio Video**
   ```javascript
   import { connect } from 'twilio-video';
   
   const room = await connect(token, { name: 'room-name' });
   ```

3. **Jitsi Meet**
   ```javascript
   const api = new JitsiMeetExternalAPI(domain, options);
   ```

## 📦 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Netlify

```bash
npm run build
netlify deploy --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## 🔒 Security Considerations

1. **Token Verification**
   - Always verify token balance server-side for sensitive operations
   - Use signature verification for authentication
   - Implement rate limiting for API calls

2. **Chat Safety**
   - Sanitize all user input
   - Implement message rate limiting
   - Add moderation tools for admins

3. **Video Security**
   - Use TURN servers for reliable connectivity
   - Implement room access controls
   - Enable end-to-end encryption if available

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run linting
npm run lint
```

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 💬 Support

- [Documentation](https://docs.your-project.com)
- [Discord](https://discord.gg/your-server)
- [Twitter](https://twitter.com/your-handle)

---

Built with ❤️ using React, Tailwind CSS, and RainbowKit
