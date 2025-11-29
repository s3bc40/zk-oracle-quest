#![allow(unexpected_cfgs)]
#![allow(deprecated)]

use anchor_lang::prelude::*;
use light_sdk::cpi::v2::CpiAccounts;
use light_sdk::cpi::{v2::LightSystemProgramCpi, InvokeLightSystemProgram, LightCpiInstruction};
use light_sdk::instruction::account_meta::CompressedAccountMeta;
use light_sdk::instruction::ValidityProof;
use light_sdk::{
    account::LightAccount, address::v2::derive_address, derive_light_cpi_signer,
    instruction::PackedAddressTreeInfo, LightDiscriminator, LightHasher,
};
use light_sdk_types::CpiSigner;

declare_id!("BziNjq5EE39WnWW2sQvvHUdUjNurKr8kA9dM4VRS5Vzg");

pub const LIGHT_CPI_SIGNER: CpiSigner =
    derive_light_cpi_signer!("BziNjq5EE39WnWW2sQvvHUdUjNurKr8kA9dM4VRS5Vzg");

// pub const LIGHT_CPI_SIGNER: CpiSigner =
//     derive_light_cpi_signer!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod zk_oracle_quest {

    use super::*;

    /// Place a private bet on an oracle event
    pub fn place_private_bet<'info>(
        ctx: Context<'_, '_, '_, 'info, PlacePrivateBet<'info>>,
        event_id: u64,
        chosen_outcome: bool,
        amount: u64,
        proof: ValidityProof,
        address_tree_info: PackedAddressTreeInfo,
        output_tree_index: u8,
    ) -> Result<()> {
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.player.as_ref(),
            ctx.remaining_accounts,
            LIGHT_CPI_SIGNER.clone(),
        );

        // Derive the addres for the bet
        let (address, address_seed) = derive_address(
            &[
                b"private_bet",
                ctx.accounts.player.key().as_ref(),
                event_id.to_le_bytes().as_ref(),
            ],
            &address_tree_info
                .get_tree_pubkey(&light_cpi_accounts)
                .map_err(|_| error!(OracleError::InvalidAddressTree))?,
            &crate::ID,
        );

        // Create the compressed account for the bet
        let mut compressed_bet =
            LightAccount::<PrivateBet>::new_init(&crate::ID, Some(address), output_tree_index);

        // Set the bet data
        compressed_bet.player = ctx.accounts.player.key();
        compressed_bet.event_id = event_id;
        compressed_bet.chosen_outcome = chosen_outcome;
        compressed_bet.amount = amount;

        let new_address_param =
            address_tree_info.into_new_address_params_assigned_packed(address_seed, Some(0));

        // Call the light client CPI to create the compressed account
        LightSystemProgramCpi::new_cpi(LIGHT_CPI_SIGNER.clone(), proof)
            .with_light_account(compressed_bet)?
            .with_new_addresses(&[new_address_param])
            .invoke(light_cpi_accounts)?;

        msg!("Private bet placed: event={}, amount={}", event_id, amount);
        Ok(())
    }

    /// Initialize a player profile
    pub fn initialize_player<'info>(
        ctx: Context<'_, '_, '_, 'info, InitializePlayer<'info>>,
        proof: ValidityProof,
        address_tree_info: PackedAddressTreeInfo,
        output_tree_index: u8,
    ) -> Result<()> {
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.player.as_ref(),
            ctx.remaining_accounts,
            LIGHT_CPI_SIGNER.clone(),
        );

        // Derive the address for the player profile
        let (address, address_seed) = derive_address(
            &[b"player_profile", ctx.accounts.player.key().as_ref()],
            &address_tree_info
                .get_tree_pubkey(&light_cpi_accounts)
                .map_err(|_| error!(OracleError::InvalidAddressTree))?,
            &crate::ID,
        );

        // Create the compressed account for the player profile
        let mut player_profile =
            LightAccount::<PlayerProfile>::new_init(&crate::ID, Some(address), output_tree_index);

        // Set the player profile data
        player_profile.owner = ctx.accounts.player.key();
        player_profile.balance = 0;
        player_profile.total_bets = 0;
        player_profile.bets_won = 0;

        let new_address_param =
            address_tree_info.into_new_address_params_assigned_packed(address_seed, Some(0));

        // Call the light client CPI to create the compressed account
        LightSystemProgramCpi::new_cpi(LIGHT_CPI_SIGNER, proof)
            .with_light_account(player_profile)?
            .with_new_addresses(&[new_address_param])
            .invoke(light_cpi_accounts)?;

        msg!(
            "Player profile initialized for {}",
            ctx.accounts.player.key()
        );
        Ok(())
    }

    /// Create a new oracle event
    pub fn create_oracle_event<'info>(
        ctx: Context<'_, '_, '_, 'info, CreateOracleEvent<'info>>,
        event_id: u64,
        description: String,
        proof: ValidityProof,
        address_tree_info: PackedAddressTreeInfo,
        output_tree_index: u8,
    ) -> Result<()> {
        require!(description.len() <= 100, OracleError::DescriptionTooLong);

        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.authority.as_ref(),
            ctx.remaining_accounts,
            LIGHT_CPI_SIGNER.clone(),
        );

        let (address, address_seed) = derive_address(
            &[b"oracle_event", &event_id.to_le_bytes()],
            &address_tree_info
                .get_tree_pubkey(&light_cpi_accounts)
                .map_err(|_| error!(OracleError::InvalidAddressTree))?,
            &crate::ID,
        );

        // Create the compressed account for the oracle event
        let mut oracle_event =
            LightAccount::<OracleEvent>::new_init(&crate::ID, Some(address), output_tree_index);

        // Set the oracle event data
        oracle_event.event_id = event_id;
        oracle_event.description = description.clone();
        oracle_event.resolved = false;
        oracle_event.outcome = false;
        oracle_event.authority = ctx.accounts.authority.key();

        let new_address_param =
            address_tree_info.into_new_address_params_assigned_packed(address_seed, Some(0));

        // Call the light client CPI to create the compressed account
        LightSystemProgramCpi::new_cpi(LIGHT_CPI_SIGNER.clone(), proof)
            .with_light_account(oracle_event)?
            .with_new_addresses(&[new_address_param])
            .invoke(light_cpi_accounts)?;

        msg!(
            "Oracle event created: id={}, description={}",
            event_id,
            description
        );
        Ok(())
    }

    /// Resolve an existing oracle event with the outcome
    pub fn resolve_oracle_event<'info>(
        ctx: Context<'_, '_, '_, 'info, ResolveOracleEvent<'info>>,
        proof: ValidityProof,
        existing_event: ExistingOracleEventIxData,
    ) -> Result<()> {
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.authority.as_ref(),
            ctx.remaining_accounts,
            LIGHT_CPI_SIGNER.clone(),
        );

        // Create mutable version of the existing oracle event
        let mut oracle_event = LightAccount::<OracleEvent>::new_mut(
            &crate::ID,
            &existing_event.account_meta,
            OracleEvent {
                event_id: existing_event.event_id,
                description: existing_event.description.clone(),
                resolved: existing_event.resolved,
                outcome: existing_event.outcome,
                authority: existing_event.authority,
            },
        )?;

        // Verify authority
        require!(
            oracle_event.authority == ctx.accounts.authority.key(),
            OracleError::UnauthorizedResolver
        );
        require!(!oracle_event.resolved, OracleError::EventAlreadyResolved);

        // Update the oracle event data
        oracle_event.resolved = true;
        oracle_event.outcome = existing_event.update_outcome;

        // Call the light client CPI to update the compressed account
        LightSystemProgramCpi::new_cpi(LIGHT_CPI_SIGNER.clone(), proof)
            .with_light_account(oracle_event)?
            .invoke(light_cpi_accounts)?;

        msg!(
            "Oracle event resolved: id={}, outcome={}",
            existing_event.event_id,
            existing_event.update_outcome
        );
        Ok(())
    }

    /// Claim winnings for a player bet
    pub fn claim_winnings<'info>(
        ctx: Context<'_, '_, '_, 'info, PlacePrivateBet<'info>>,
        proof: ValidityProof,
        existing_bet: ExistingPrivateBetIxData,
        existing_profile: ExistingPlayerProfileIxData,
        resolved_event: ResolvedOracleEventIxData,
    ) -> Result<()> {
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.player.as_ref(),
            ctx.remaining_accounts,
            LIGHT_CPI_SIGNER.clone(),
        );

        // Verify the bet belongs to the player
        require!(
            existing_bet.player == ctx.accounts.player.key(),
            OracleError::UnauthorizedClaim
        );

        // Verify the event is resolved
        require!(resolved_event.resolved, OracleError::EventNotResolved);

        // Verify if the event id matches
        require!(
            existing_bet.event_id == resolved_event.event_id,
            OracleError::EventMismatch
        );

        // Check if the player won
        let player_won = existing_bet.chosen_outcome == resolved_event.outcome;
        require!(player_won, OracleError::BetDidNotWin);

        // Update bet and profile data accordingly
        let mut player_profile = LightAccount::<PlayerProfile>::new_mut(
            &crate::ID,
            &existing_profile.account_meta,
            PlayerProfile {
                owner: existing_profile.owner,
                balance: existing_profile.balance,
                total_bets: existing_profile.total_bets,
                bets_won: existing_profile.bets_won,
            },
        )?;

        // Verify profile owner matches
        require!(
            player_profile.owner == ctx.accounts.player.key(),
            OracleError::UnauthorizedClaim
        );

        // Calculate winnings by doubling the bet amount (simplicity)
        let winnings = existing_bet
            .amount
            .checked_mul(2)
            .ok_or(OracleError::BetOverflow)?;
        player_profile.balance = player_profile
            .balance
            .checked_add(winnings)
            .ok_or(OracleError::BalanceOverflow)?;
        player_profile.bets_won = player_profile
            .bets_won
            .checked_add(1)
            .ok_or(OracleError::BetsWonOverflow)?;

        // Call the light client CPI to update the player profile
        LightSystemProgramCpi::new_cpi(LIGHT_CPI_SIGNER.clone(), proof)
            .with_light_account(player_profile)?
            .invoke(light_cpi_accounts)?;

        msg!(
            "Winnings claimed: player={}, amount={}, new_balance={}",
            ctx.accounts.player.key(),
            winnings,
            existing_profile.balance + winnings
        );
        Ok(())
    }
}

#[error_code]
pub enum OracleError {
    #[msg("failed to get address tree pubkey")]
    InvalidAddressTree,
    #[msg("description too long (max 100 chars)")]
    DescriptionTooLong,
    #[msg("only authority can resolve oracle events")]
    UnauthorizedResolver,
    #[msg("event already resolved")]
    EventAlreadyResolved,
    #[msg("unauthorized to claim winnings")]
    UnauthorizedClaim,
    #[msg("event not resolved yet")]
    EventNotResolved,
    #[msg("event ID mismatch")]
    EventMismatch,
    #[msg("bet did not win")]
    BetDidNotWin,
    #[msg("bet amount overflow")]
    BetOverflow,
    #[msg("balance overflow")]
    BalanceOverflow,
    #[msg("bets won overflow")]
    BetsWonOverflow,
}

#[derive(Accounts)]
pub struct PlacePrivateBet<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateOracleEvent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveOracleEvent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
}

/// Compressed account data for a private bet
#[derive(
    Clone, Debug, Default, AnchorDeserialize, AnchorSerialize, LightDiscriminator, LightHasher,
)]
pub struct PrivateBet {
    #[hash]
    pub player: Pubkey,
    #[hash]
    pub event_id: u64,
    #[hash]
    pub chosen_outcome: bool,
    #[hash]
    pub amount: u64,
}

/// Compressed account data for a player profile
#[derive(
    Clone, Debug, Default, AnchorDeserialize, AnchorSerialize, LightDiscriminator, LightHasher,
)]
pub struct PlayerProfile {
    #[hash]
    pub owner: Pubkey,
    #[hash]
    pub balance: u64,
    #[hash]
    pub total_bets: u64,
    #[hash]
    pub bets_won: u64,
}

/// Compressed account for oracle events
#[derive(
    Clone, Debug, Default, AnchorDeserialize, AnchorSerialize, LightDiscriminator, LightHasher,
)]
pub struct OracleEvent {
    #[hash]
    pub event_id: u64,
    #[hash]
    pub description: String,
    #[hash]
    pub resolved: bool,
    #[hash]
    pub outcome: bool,
    #[hash]
    pub authority: Pubkey,
}

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct ExistingOracleEventIxData {
    pub account_meta: CompressedAccountMeta,
    pub event_id: u64,
    pub description: String,
    pub resolved: bool,
    pub outcome: bool,
    pub authority: Pubkey,
    pub update_outcome: bool, // The new outcome to set
}

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct ExistingPrivateBetIxData {
    pub account_meta: CompressedAccountMeta,
    pub player: Pubkey,
    pub event_id: u64,
    pub chosen_outcome: bool,
    pub amount: u64,
}

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct ExistingPlayerProfileIxData {
    pub account_meta: CompressedAccountMeta,
    pub owner: Pubkey,
    pub balance: u64,
    pub total_bets: u64,
    pub bets_won: u64,
}

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct ResolvedOracleEventIxData {
    pub event_id: u64,
    pub resolved: bool,
    pub outcome: bool,
}

// Stub for IDL
#[event]
pub struct AccountTypes {
    pub private_bet: PrivateBet,
    pub player_profile: PlayerProfile,
    pub oracle_event: OracleEvent,
}
