#![allow(unexpected_cfgs)]
#![allow(deprecated)]

use anchor_lang::prelude::*;
use light_sdk::cpi::v2::CpiAccounts;
use light_sdk::cpi::{v2::LightSystemProgramCpi, InvokeLightSystemProgram, LightCpiInstruction};
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
}

#[error_code]
pub enum OracleError {
    #[msg("failed to get address tree pubkey")]
    InvalidAddressTree,
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
