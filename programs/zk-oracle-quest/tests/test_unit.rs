use anchor_lang::prelude::*;
use zk_oracle_quest::{PlayerProfile, PrivateBet};

#[test]
fn test_player_profile_creation() {
    let owner = Pubkey::new_unique();
    let profile = PlayerProfile {
        owner,
        balance: 0,
        total_bets: 0,
        bets_won: 0,
    };

    assert_eq!(profile.owner, owner);
    assert_eq!(profile.balance, 0);
    assert_eq!(profile.total_bets, 0);
    assert_eq!(profile.bets_won, 0);

    println!("✅ PlayerProfile structure test passed");
}

#[test]
fn test_private_bet_creation() {
    let player = Pubkey::new_unique();
    let bet = PrivateBet {
        player,
        event_id: 1,
        chosen_outcome: true,
        amount: 1_000_000, // 0.001 SOL
    };

    assert_eq!(bet.player, player);
    assert_eq!(bet.event_id, 1);
    assert_eq!(bet.chosen_outcome, true);
    assert_eq!(bet.amount, 1_000_000);

    println!("✅ PrivateBet structure test passed");
}

#[test]
fn test_player_profile_balance_update() {
    let mut profile = PlayerProfile {
        owner: Pubkey::new_unique(),
        balance: 1_000_000,
        total_bets: 5,
        bets_won: 2,
    };

    // Simulate winning a bet
    profile.balance += 500_000;
    profile.bets_won += 1;

    assert_eq!(profile.balance, 1_500_000);
    assert_eq!(profile.bets_won, 3);

    println!("✅ Balance update test passed");
}
