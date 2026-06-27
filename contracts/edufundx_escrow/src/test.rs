#![cfg(test)]
extern crate std;

use crate::{EduFundXEscrow, EduFundXEscrowClient};
use edufundx_core::{EduFundXCore, EduFundXCoreClient};
use edufundx_reputation::{EduFundXReputation, EduFundXReputationClient};
use soroban_sdk::{testutils::Address as _, token, Address, Env, String};

fn setup() -> (
    Env,
    EduFundXEscrowClient<'static>,
    EduFundXCoreClient<'static>,
    EduFundXReputationClient<'static>,
    Address, // admin
    Address, // token
    Address, // student
    Address, // sponsor
    Address, // milestone contract (mock for now)
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let student = Address::generate(&env);
    let sponsor = Address::generate(&env);
    let milestone_contract_mock = Address::generate(&env);

    // Register token
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
    
    // Mint tokens to sponsor
    token_admin_client.mint(&sponsor, &50000_i128);

    // Register reputation contract
    let reputation_id = env.register(EduFundXReputation, ());
    let reputation_client = EduFundXReputationClient::new(&env, &reputation_id);

    // Register core/registry contract
    let core_id = env.register(EduFundXCore, ());
    let core_client = EduFundXCoreClient::new(&env, &core_id);

    // Register escrow contract
    let escrow_id = env.register(EduFundXEscrow, ());
    let escrow_client = EduFundXEscrowClient::new(&env, &escrow_id);

    // Initialize all
    core_client.initialize(&admin, &reputation_id, &token_id, &250_u32);
    reputation_client.initialize(&admin, &core_id);
    escrow_client.initialize(
        &admin,
        &core_id,
        &token_id,
        &reputation_id,
        &milestone_contract_mock,
    );
    core_client.set_escrow_contract(&admin, &escrow_id);
    core_client.set_milestone_contract(&admin, &milestone_contract_mock);

    (
        env,
        escrow_client,
        core_client,
        reputation_client,
        admin,
        token_id,
        student,
        sponsor,
        milestone_contract_mock,
    )
}

#[test]
fn test_initialize() {
    let (_env, escrow_client, core_client, rep_client, admin, token_id, _student, _sponsor, milestone) = setup();

    assert_eq!(escrow_client.get_admin(), admin);
    assert_eq!(escrow_client.get_project_total_escrow(&1), 0);
    assert_eq!(escrow_client.get_project_released(&1), 0);

    // Re-initialization should fail
    let res = escrow_client.try_initialize(
        &admin,
        &core_client.address,
        &token_id,
        &rep_client.address,
        &milestone,
    );
    assert!(res.is_err());
}

#[test]
fn test_sponsor_project() {
    let (env, escrow_client, core_client, rep_client, _admin, token_id, student, sponsor, _milestone) = setup();

    let title = String::from_str(&env, "Soroban Research");
    let desc = String::from_str(&env, "Research on Soroban");
    let cat = String::from_str(&env, "Research");
    let goal = 2000_i128;

    let proj_id = core_client.create_project(&student, &title, &desc, &cat, &goal);

    // Cannot sponsor a project in Draft status
    let res = escrow_client.try_sponsor_project(&sponsor, &proj_id, &1000_i128);
    assert!(res.is_err());

    // Activate the project
    core_client.update_project_status(&student, &proj_id, &1_u32); // 1 = Active

    // Sponsor the project with 1000 XLM
    escrow_client.sponsor_project(&sponsor, &proj_id, &1000_i128);

    assert_eq!(escrow_client.get_sponsorship(&proj_id, &sponsor), 1000_i128);
    assert_eq!(escrow_client.get_project_total_escrow(&proj_id), 1000_i128);

    // Token balance verification
    let token_client = token::Client::new(&env, &token_id);
    assert_eq!(token_client.balance(&sponsor), 49000_i128);
    assert_eq!(token_client.balance(&escrow_client.address), 1000_i128);

    // Sponsor reputation score should be updated (+10 score)
    let rep = rep_client.get_sponsor_reputation(&sponsor);
    assert_eq!(rep.score, 10);
    assert_eq!(rep.total_contributed, 1000);
}

#[test]
fn test_release_milestone_funds() {
    let (env, escrow_client, core_client, _rep_client, _admin, token_id, student, sponsor, milestone) = setup();

    let title = String::from_str(&env, "Soroban Research");
    let desc = String::from_str(&env, "Research on Soroban");
    let cat = String::from_str(&env, "Research");
    let goal = 2000_i128;

    let proj_id = core_client.create_project(&student, &title, &desc, &cat, &goal);
    core_client.update_project_status(&student, &proj_id, &1_u32); // Active

    // Sponsor
    escrow_client.sponsor_project(&sponsor, &proj_id, &2000_i128);

    // Attempt release from unauthorized address
    let bad_release = escrow_client.try_release_milestone_funds(&sponsor, &proj_id, &student, &500_i128);
    assert!(bad_release.is_err());

    // Release 500 XLM from milestone contract
    escrow_client.release_milestone_funds(&milestone, &proj_id, &student, &500_i128);

    assert_eq!(escrow_client.get_project_total_escrow(&proj_id), 1500_i128);
    assert_eq!(escrow_client.get_project_released(&proj_id), 500_i128);

    let token_client = token::Client::new(&env, &token_id);
    assert_eq!(token_client.balance(&student), 500_i128);
    assert_eq!(token_client.balance(&escrow_client.address), 1500_i128);
}

#[test]
fn test_refund_on_cancellation() {
    let (env, escrow_client, core_client, _rep_client, admin, token_id, student, sponsor, _milestone) = setup();

    let title = String::from_str(&env, "Soroban Research");
    let desc = String::from_str(&env, "Research on Soroban");
    let cat = String::from_str(&env, "Research");
    let goal = 2000_i128;

    let proj_id = core_client.create_project(&student, &title, &desc, &cat, &goal);
    core_client.update_project_status(&student, &proj_id, &1_u32); // Active

    escrow_client.sponsor_project(&sponsor, &proj_id, &1500_i128);

    // Cancel project via core registry
    core_client.update_project_status(&admin, &proj_id, &4_u32); // 4 = Cancelled

    // Sponsor requests refund
    escrow_client.refund_sponsor(&sponsor, &proj_id);

    // Verify refund
    let token_client = token::Client::new(&env, &token_id);
    assert_eq!(token_client.balance(&sponsor), 50000_i128); // original balance restored
    assert_eq!(token_client.balance(&escrow_client.address), 0_i128);
    assert_eq!(escrow_client.get_sponsorship(&proj_id, &sponsor), 0_i128);
}
