# ZK Oracle Quest 🎮

A privacy-preserving prediction game built on Solana using ZK Compression (Light Protocol).

## 🎯 What is ZK Oracle Quest?

Players place **private bets** on oracle events using compressed accounts. When events resolve, winners claim their rewards - all while keeping bet details private and costs ultra-low through ZK compression.

## ✨ Features

- **Private Betting**: Bets stored as compressed accounts with ZK proofs
- **Cost-Efficient**: ~1000x cheaper than traditional Solana accounts
- **Oracle Events**: Admin-controlled event creation and resolution
- **Player Profiles**: Track balance, total bets, and wins
- **Claim Winnings**: Automatic payout (2x bet amount for winners)

## 🏗️ Architecture

Built with:

- **Anchor Framework** (v0.31.1)
- **Light Protocol SDK** (v0.16.0) - ZK Compression
- **Solana** (Compressed PDAs for state management)

### Instructions

1. `initialize_player` - Create player profile
2. `place_private_bet` - Place bet on event outcome
3. `create_oracle_event` - Admin creates new event
4. `resolve_oracle_event` - Admin resolves event with outcome
5. `claim_winnings` - Winners claim 2x their bet amount

## 📦 Compressed Accounts

- **PlayerProfile**: Owner, balance, total_bets, bets_won
- **PrivateBet**: Player, event_id, chosen_outcome, amount
- **OracleEvent**: Event_id, description, resolved, outcome, authority

## 🚀 Quick Start

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.1
avm use 0.31.1

# Install Light CLI
npm install -g @lightprotocol/zk-compression-cli
```

### Build & Deploy

```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## 🧪 Testing

```bash
# Run unit tests
cargo test --package zk-oracle-quest --test unit_test -- --nocapture

# Build for Solana BPF
cargo build-sbf
```

## 🎮 Game Flow

1. **Admin** creates an oracle event: "Will BTC hit $100k?"
2. **Players** place private bets (Yes/No) with SOL amounts
3. **Admin** resolves the event when outcome is known
4. **Winners** claim 2x their bet amount automatically

## 💡 Why ZK Compression?

Traditional Solana accounts cost ~0.002 SOL each. With ZK Compression:

- Bets cost **~1000x less** to store
- Privacy: Bet details hashed in Merkle tree
- Scalability: Thousands of bets without rent issues

## 📊 Program Statistics

- **Total Instructions**: 5
- **Compressed Account Types**: 3
- **Lines of Code**: ~420
- **Storage Cost Reduction**: ~99.9%

## 🔐 Security Features

- Authority-only event resolution
- Player ownership verification
- Overflow protection on all math operations
- Double-claim prevention

## 🛣️ Roadmap

- [ ] Phaser 3 frontend with pixel art
- [ ] Multiple bet multipliers (1.5x, 3x, 10x)
- [ ] Event categories (Sports, Crypto, Politics)
- [ ] Leaderboard system
- [ ] Event expiry/timeout logic

## 📝 License

MIT

## 🤝 Contributing

Built for [Indie.fun hackathon](https://hackathon.indie.fun/).

---

**Built with ❤️ using Light Protocol's ZK Compression**
