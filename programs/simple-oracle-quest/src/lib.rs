use anchor_lang::prelude::*;

declare_id!("9tSP8kXEUif9doAPhAbUKZm3qKNphpcHGKc35jLr1xEA");

#[program]
pub mod simple_oracle_quest {
    use super::*;

    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player_profile;
        player.owner = ctx.accounts.signer.key();
        player.balance = 0;
        player.total_bets = 0;
        player.bets_won = 0;
        msg!("Player initialized: {}", player.owner);
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        event_id: u64,
        chosen_outcome: bool,
        amount: u64,
    ) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        bet.player = ctx.accounts.signer.key();
        bet.event_id = event_id;
        bet.chosen_outcome = chosen_outcome;
        bet.amount = amount;
        bet.claimed = false;

        let player = &mut ctx.accounts.player_profile;
        player.total_bets += 1;

        let oracle_event = &mut ctx.accounts.oracle_event;
        oracle_event.total_bets += 1;
        oracle_event.total_amount += amount;
        if chosen_outcome {
            oracle_event.yes_votes += 1;
        } else {
            oracle_event.no_votes += 1;
        }

        msg!(
            "Bet placed: {} lamports on {}",
            amount,
            if chosen_outcome { "YES" } else { "NO" }
        );
        Ok(())
    }

    pub fn create_oracle_event(
        ctx: Context<CreateOracleEvent>,
        event_id: u64,
        description: String,
    ) -> Result<()> {
        require!(description.len() <= 200, ErrorCode::DescriptionTooLong);

        let event = &mut ctx.accounts.oracle_event;
        event.event_id = event_id;
        event.description = description;
        event.resolved = false;
        event.authority = ctx.accounts.authority.key();
        event.total_bets = 0;
        event.yes_votes = 0;
        event.no_votes = 0;
        event.total_amount = 0;

        msg!("Event created: {}", event.description);
        Ok(())
    }

    pub fn resolve_event(ctx: Context<ResolveEvent>, outcome: bool) -> Result<()> {
        let event = &mut ctx.accounts.oracle_event;
        require!(!event.resolved, ErrorCode::AlreadyResolved);

        event.resolved = true;
        event.outcome = Some(outcome);
        msg!("Event resolved: {}", if outcome { "YES" } else { "NO" });
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let event = &ctx.accounts.oracle_event;

        require!(event.resolved, ErrorCode::EventNotResolved);
        require!(!bet.claimed, ErrorCode::AlreadyClaimed);
        require!(
            bet.chosen_outcome == event.outcome.unwrap(),
            ErrorCode::BetLost
        );
        require!(
            bet.player == ctx.accounts.signer.key(),
            ErrorCode::NotBetOwner
        );

        bet.claimed = true;

        let winnings = bet.amount * 2;
        let player = &mut ctx.accounts.player_profile;
        player.bets_won += 1;
        player.balance += winnings;

        msg!("Winnings claimed: {} lamports", winnings);
        Ok(())
    }

    pub fn close_bet(_ctx: Context<CloseBet>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 8 + 8 + 8,
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(event_id: u64)]
pub struct PlaceBet<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + PlayerProfile::INIT_SPACE,
        seeds = [b"bet", signer.key().as_ref(), event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    #[account(
        mut,
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    #[account(
        mut,
        seeds = [b"event", event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub oracle_event: Account<'info, OracleEvent>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(event_id: u64)]
pub struct CreateOracleEvent<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + OracleEvent::INIT_SPACE,
        seeds = [b"event", event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub oracle_event: Account<'info, OracleEvent>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveEvent<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub oracle_event: Account<'info, OracleEvent>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [b"bet", signer.key().as_ref(), bet.event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    #[account(
        seeds = [b"event", bet.event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub oracle_event: Account<'info, OracleEvent>,
    #[account(
        mut,
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseBet<'info> {
    #[account(mut, close = signer)]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    pub owner: Pubkey,
    pub balance: u64,
    pub total_bets: u64,
    pub bets_won: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub player: Pubkey,
    pub event_id: u64,
    pub chosen_outcome: bool,
    pub amount: u64,
    pub claimed: bool,
}

#[account]
#[derive(InitSpace)]
pub struct OracleEvent {
    pub event_id: u64,
    #[max_len(200)]
    pub description: String,
    pub resolved: bool,
    pub outcome: Option<bool>,
    pub authority: Pubkey,
    pub total_bets: u64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub total_amount: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Event already resolved")]
    AlreadyResolved,
    #[msg("Event not resolved yet")]
    EventNotResolved,
    #[msg("Winnings already claimed")]
    AlreadyClaimed,
    #[msg("Bet lost")]
    BetLost,
    #[msg("Description too long (max 200 characters)")]
    DescriptionTooLong,
    #[msg("Not the bet owner")]
    NotBetOwner,
}
