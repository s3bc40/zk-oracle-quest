# 🎮 ZK Oracle Quest

A blockchain-based prediction game built on Solana where players bet on oracle events using a Phaser.js dungeon crawler interface.

![Solana](https://img.shields.io/badge/Solana-Devnet-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Anchor](https://img.shields.io/badge/Anchor-0.30-blue)
![Phaser](https://img.shields.io/badge/Phaser-3.80-orange)

---

## 🌟 Overview

ZK Oracle Quest is a **demonstration project** that combines:

- **On-chain prediction markets** via Solana smart contracts
- **Interactive game mechanics** with Phaser.js
- **Real wallet integration** for placing bets
- **Admin panel** for event management

Players explore a 2D dungeon, interact with oracle NPCs, and place SOL bets on future events. When events resolve, winners can claim their rewards!

---

## 🚀 Features

### ✅ Implemented

- **Smart Contract (Anchor)**

  - Player profile initialization
  - Event creation and resolution
  - Bet placement with SOL deposits
  - Winnings claim system
  - Account cleanup (close bets)

- **Frontend (Next.js + Phaser)**

  - Wallet connection (Phantom, Solflare, etc.)
  - Interactive 2D game world
  - Real-time oracle interaction
  - Bet modal with amount/outcome selection
  - Quest log showing player's bet history
  - Admin panel for event management

- **Admin Tools**
  - Create new oracle events
  - Resolve events (YES/NO outcomes)
  - View all on-chain bets
  - Close/cleanup old bets

---

## 🎯 Key Improvements Made

### 1. **Program Architecture**

- ✅ Fixed bet ownership model (stores wallet pubkey instead of PDA)
- ✅ Added player profile for statistics tracking
- ✅ Implemented proper PDA derivation for all accounts
- ✅ Added bet closure instruction for rent reclamation

### 2. **Frontend Enhancements**

- ✅ React + Phaser integration with EventBus
- ✅ Proper lifecycle management (scene creation/destruction)
- ✅ Real-time event fetching from blockchain
- ✅ Responsive UI with Tailwind CSS
- ✅ Error handling and loading states

### 3. **UX Improvements**

- ✅ Visual feedback for bet placement
- ✅ Quest log to track personal bets
- ✅ Admin panel for easy event management
- ✅ Wallet connection state handling
- ✅ Player initialization flow

---

## ⚠️ Known Issues & Limitations

### 🐛 Technical Issues

1. **Race Condition on Navigation**

   - **Issue**: Sometimes throws "Cannot read properties of undefined (reading 'sys')" when navigating back to game
   - **Cause**: EventBus firing before Phaser scene is fully ready
   - **Workaround**: Refresh page or navigate away and back
   - **Status**: Partial fix implemented with `sceneReady` flag

2. **Event Loading Timing**

   - **Issue**: Events may not load immediately on first visit
   - **Cause**: Async blockchain fetch race with Phaser scene creation
   - **Workaround**: Added debouncing and loading indicators
   - **Status**: Mostly stable but can be improved

3. **Bet PDA Cleanup**
   - **Issue**: Old bets with incorrect player addresses remain on-chain
   - **Cause**: Changed player field from PDA to wallet address mid-development
   - **Workaround**: Admin can close old bets via admin panel
   - **Status**: Working solution, requires manual cleanup

### 🎨 UI/UX Limitations

1. **Mobile Responsiveness**

   - Game canvas is fixed size (not mobile-friendly)
   - Wallet modals may have issues on small screens

2. **Error Messages**

   - Some errors show technical details instead of user-friendly messages
   - Transaction failures could be handled more gracefully

3. **Game Balance**
   - No payout ratio calculation (fixed 2x return)
   - No minimum/maximum bet limits
   - No time-based event deadlines enforced

---

## 🚧 Display Purpose Only

### **This is a DEMO PROJECT, not production-ready!**

#### Security Considerations

- ⚠️ **No ZK proofs implemented** (despite "ZK" in name)
- ⚠️ **Admin wallet hardcoded** in source code
- ⚠️ **No multi-sig** for event resolution
- ⚠️ **No dispute mechanism** if oracle is malicious
- ⚠️ **Devnet only** - uses test SOL, not real funds

#### Game Design Limitations

- Single admin controls all event outcomes (centralization risk)
- No provably fair randomness
- No economic incentives for oracle honesty
- Winners must manually claim (no auto-payout)
- Fixed 2x payout regardless of odds

#### Production Requirements (Not Implemented)

- [ ] Oracle decentralization (multiple validators)
- [ ] Time-lock mechanisms for event resolution
- [ ] Dynamic payout ratios based on bet distribution
- [ ] Slashing for malicious oracles
- [ ] Zero-knowledge proofs for privacy
- [ ] Audit trail and dispute resolution
- [ ] Rate limiting and sybil resistance
- [ ] Comprehensive test suite
- [ ] Security audit

---

## 🛠️ Tech Stack

- **Blockchain**: Solana (Devnet)
- **Smart Contracts**: Anchor Framework 0.30
- **Frontend**: Next.js 14, React 18
- **Game Engine**: Phaser 3.80
- **Styling**: Tailwind CSS
- **Wallet**: Solana Wallet Adapter

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- Rust 1.75+
- Solana CLI 1.18+
- Anchor CLI 0.30+

### Setup

```bash
# Clone repository
git clone <your-repo>
cd zk-oracle-quest

# Install dependencies
npm install

# Build Anchor program
anchor build

# Deploy to devnet
anchor deploy

# Update program ID in lib.rs and Anchor.toml
# Then rebuild and redeploy

# Start frontend
npm run dev
```

### Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=<your-program-id>
```

---

## 🎮 How to Play

1. **Connect Wallet** (devnet, get SOL from faucet)
2. **Initialize Player** on home page
3. **Enter Game** - explore the dungeon
4. **Walk to Oracles** (green glowing sprites)
5. **Press SPACE** to interact
6. **Place Bet** - choose YES/NO and amount
7. **Wait for Resolution** (admin resolves via admin panel)
8. **Claim Winnings** if you won!

---

## 👨‍💼 Admin Panel

Access at `/admin` (hardcoded admin wallet only)

- Create new events
- Resolve events (YES/NO)
- View all bets
- Close old/invalid bets

**Admin Wallet**: `69jHhkYPRaMKDM139vYQvH3HsM8mWh9bCBLg44BHkr19`

---

## 🧪 Testing the Admin Panel

This project includes **Public Demo Mode** for judges and reviewers.

### How It Works

When deployed with `NEXT_PUBLIC_ENABLE_PUBLIC_ADMIN=true`:

- ✅ **Anyone** with a connected wallet can access `/admin`
- ✅ Create events, resolve outcomes, manage bets
- ✅ All features work on **Devnet only** (test SOL)
- ✅ Orange banner indicates demo mode is active

### For Judges

1. **Connect any wallet** (Phantom, Solflare, etc.)
2. Get devnet SOL from [https://faucet.solana.com](https://faucet.solana.com)
3. Visit `/admin` page
4. **Create events**, **place bets** (via `/game`), **resolve outcomes**
5. Test the full prediction market workflow!

### Production vs Demo

| Mode             | Environment Variable                    | Who Can Access Admin         |
| ---------------- | --------------------------------------- | ---------------------------- |
| **Production**   | `NEXT_PUBLIC_ENABLE_PUBLIC_ADMIN=false` | Only hardcoded admin wallet  |
| **Demo/Judging** | `NEXT_PUBLIC_ENABLE_PUBLIC_ADMIN=true`  | Anyone with wallet connected |

⚠️ **Note**: Even in demo mode, this is still **devnet only** with test SOL. No real funds at risk!

---

## 📁 Project Structure

```
zk-oracle-quest/
├── programs/
│   └── simple-oracle-quest/
│       └── src/
│           └── lib.rs              # Anchor smart contract
├── app/
│   ├── app/
│   │   ├── page.tsx               # Home page
│   │   ├── game/
│   │   │   ├── page.tsx           # Game page (Phaser + React)
│   │   │   └── game/
│   │   │       └── scenes/
│   │   │           └── MainGame.ts # Phaser game scene
│   │   └── admin/
│   │       └── page.tsx           # Admin panel
│   ├── components/
│   │   ├── BetModal.tsx           # Bet placement UI
│   │   └── QuestLog.tsx           # Player's bet history
│   └── lib/
│       ├── anchor-client.ts       # Anchor setup
│       └── program-interactions.ts # Blockchain functions
├── Anchor.toml
├── package.json
└── README.md
```

---

## 🔮 Future Improvements

### High Priority

- [ ] Fix navigation race condition completely
- [ ] Add comprehensive error handling
- [ ] Implement proper loading states
- [ ] Mobile-responsive design
- [ ] User-friendly error messages

### Medium Priority

- [ ] Dynamic payout ratios (odds-based)
- [ ] Event categories and filtering
- [ ] Leaderboard for top players
- [ ] Transaction history
- [ ] Multi-event betting

### Low Priority / Nice-to-Have

- [ ] NFT rewards for wins
- [ ] Social features (chat, guilds)
- [ ] Mini-games for earning bet funds
- [ ] Achievement system
- [ ] Sound effects and music

### Dream Features (Requires Research)

- [ ] Actual ZK proofs for privacy
- [ ] Decentralized oracle network
- [ ] DAO governance for event creation
- [ ] Cross-chain betting
- [ ] AI-generated event descriptions

---

## 🤝 Contributing

This is a demo project for educational purposes. Feel free to fork and experiment!

If you find bugs or have suggestions:

1. Open an issue
2. Describe the problem
3. Include console logs if applicable

---

## 📜 License

MIT License - feel free to use for learning!

---

## ⚡ Quick Start (TL;DR)

```bash
# 1. Install and deploy
npm install
anchor build && anchor deploy

# 2. Update program ID everywhere
# Edit: lib.rs, Anchor.toml, anchor-client.ts

# 3. Run frontend
npm run dev

# 4. Get devnet SOL
# Visit https://faucet.solana.com

# 5. Play!
# Connect wallet → Initialize player → Enter game
```

---

## 🙏 Acknowledgments

- Built with [Anchor Framework](https://www.anchor-lang.com/)
- Game engine: [Phaser 3](https://phaser.io/)
- UI: [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- Inspired by prediction markets and blockchain gaming

---

## 📞 Contact

For questions or demo requests, feel free to reach out!

**Remember: This is a DEMO. Do not use with real funds on mainnet!** 🚨

---

Made with ☕ and ⚡ by [Your Name]
