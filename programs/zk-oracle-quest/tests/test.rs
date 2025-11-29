#![cfg(feature = "test-sbf")]

use anchor_lang::{AnchorDeserialize, InstructionData, ToAccountMetas};
use light_program_test::{
    program_test::LightProgramTest, AddressWithTree, Indexer, ProgramTestConfig, Rpc, RpcError,
};
use light_sdk::{
    address::v2::derive_address,
    instruction::{PackedAccounts, SystemAccountMetaConfig},
};
use solana_sdk::{
    instruction::Instruction,
    signature::{Keypair, Signature, Signer},
};
use zk_oracle_quest::PlayerProfile;

#[tokio::test]
async fn test_initialize_player() {
    let config =
        ProgramTestConfig::new(false, Some(vec![("zk_oracle_quest", zk_oracle_quest::ID)]));
    let mut rpc = LightProgramTest::new(config).await.unwrap();
    let payer = rpc.get_payer().insecure_clone();
    let player = Keypair::new();

    // Airdrop to player
    rpc.airdrop_lamports(&player.pubkey(), 1_000_000_000)
        .await
        .unwrap();

    println!("✅ Player funded: {}", player.pubkey());

    let address_tree_info = rpc.get_address_tree_v2();

    let (player_address, _) = derive_address(
        &[b"player_profile", player.pubkey().as_ref()],
        &address_tree_info.tree,
        &zk_oracle_quest::ID,
    );

    println!("Player address: {:?}", player_address);

    // Create the player profile
    create_player_profile(
        &mut rpc,
        &player,
        &player_address,
        address_tree_info.clone(),
    )
    .await
    .unwrap();

    // Verify the player profile was created
    let player_accounts = rpc
        .get_compressed_accounts_by_owner(&zk_oracle_quest::ID, None, None)
        .await
        .unwrap();

    assert_eq!(player_accounts.value.items.len(), 1);
    let player_account = &player_accounts.value.items[0];

    println!("Created player profile for pubkey: {}", player.pubkey());

    // Verify the account data
    let profile_data = player_account.data.as_ref().unwrap();
    let profile = PlayerProfile::deserialize(&mut profile_data.data.as_slice()).unwrap();

    assert_eq!(profile.owner, player.pubkey());
    assert_eq!(profile.balance, 0);
    assert_eq!(profile.total_bets, 0);
    assert_eq!(profile.bets_won, 0);

    println!("✅ Player profile initialized successfully!");
}

async fn create_player_profile<R>(
    rpc: &mut R,
    player: &Keypair,
    address: &[u8; 32],
    address_tree_info: light_client::indexer::TreeInfo,
) -> Result<Signature, RpcError>
where
    R: Rpc + Indexer,
{
    let mut remaining_accounts = PackedAccounts::default();
    let config = SystemAccountMetaConfig::new(zk_oracle_quest::ID);
    remaining_accounts.add_system_accounts(config)?;

    let rpc_result = rpc
        .get_validity_proof(
            vec![],
            vec![AddressWithTree {
                address: *address,
                tree: address_tree_info.tree,
            }],
            None,
        )
        .await?
        .value;

    let packed_address_tree_accounts = rpc_result
        .pack_tree_infos(&mut remaining_accounts)
        .address_trees;

    let output_state_tree_index = rpc
        .get_random_state_tree_info()?
        .pack_output_tree_index(&mut remaining_accounts)?;

    let instruction_data = zk_oracle_quest::instruction::InitializePlayer {
        proof: rpc_result.proof,
        address_tree_info: packed_address_tree_accounts[0],
        output_tree_index: output_state_tree_index,
    };

    let accounts = zk_oracle_quest::accounts::InitializePlayer {
        player: player.pubkey(),
    };

    let (remaining_accounts_metas, _, _) = remaining_accounts.to_account_metas();

    let instruction = Instruction {
        program_id: zk_oracle_quest::ID,
        accounts: [accounts.to_account_metas(None), remaining_accounts_metas].concat(),
        data: instruction_data.data(),
    };

    rpc.create_and_send_transaction(&[instruction], &player.pubkey(), &[player])
        .await
}
