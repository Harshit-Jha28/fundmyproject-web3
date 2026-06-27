#![cfg(test)]
extern crate std;

use crate::{EduFundXMilestone, EduFundXMilestoneClient};
use crate::storage::{MilestoneStatus, MilestoneInfo};
use edufundx_core::{EduFundXCore, EduFundXCoreClient};
use edufundx_reputation::{EduFundXReputation, EduFundXReputationClient};
use edufundx_escrow::{EduFundXEscrow, EduFundXEscrowClient};
use soroban_sdk::{testutils::Address as _, token, Address, Env, String};

fn setup() -> (
    Env,
    EduFundXMilestoneClient<'static>,
    EduFundXCoreClient<'static>,
    EduFundXReputationClient<'static>,
    EduFundXEscrowClient<'static>,
    Address, // admin
    Address, // token
    Address, // student
    Address, // sponsor
    Address, // reviewer
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let student = Address::generate(&env);
    let sponsor = Address::generate(&env);
    let reviewer = Address::generate(&env);

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

    // Register milestone contract
    let milestone_id = env.register(EduFundXMilestone, ());
    let milestone_client = EduFundXMilestoneClient::new(&env, &milestone_id);

    // Initialize all
    core_client.initialize(&admin, &reputation_id, &token_id, &250_u32);
    reputation_client.initialize(&admin, &core_id);
    escrow_client.initialize(
        &admin,
        &core_id,
        &token_id,
        &reputation_id,
        &milestone_id,
    );
    milestone_client.initialize(
        &admin,
        &core_id,
        &escrow_id,
        &reputation_id,
    );
    core_client.set_escrow_contract(&admin, &escrow_id);
    core_client.set_milestone_contract(&admin, &milestone_id);

    (
        env,
        milestone_client,
        core_client,
        reputation_client,
        escrow_client,
        admin,
        token_id,
        student,
        sponsor,
        reviewer,
    )
}

#[test]
fn test_milestone_flow_end_to_end() {
    let (
        env,
        milestone_client,
        core_client,
        rep_client,
        escrow_client,
        _admin,
        token_id,
        student,
        sponsor,
        reviewer,
    ) = setup();

    // 1. Student creates a project in Draft mode
    let title = String::from_str(&env, "EduFundX");
    let desc = String::from_str(&env, "Student funding platform");
    let cat = String::from_str(&env, "Web3");
    let goal = 2000_i128;

    let proj_id = core_client.create_project(&student, &title, &desc, &cat, &goal);

    // 2. Student adds two milestones
    let ms0_title = String::from_str(&env, "Milestone 1");
    let ms0_desc = String::from_str(&env, "Smart contracts");
    let ms0_index = milestone_client.add_milestone(
        &student,
        &proj_id,
        &ms0_title,
        &ms0_desc,
        &800_i128,
        &reviewer,
    );
    assert_eq!(ms0_index, 0);

    let ms1_title = String::from_str(&env, "Milestone 2");
    let ms1_desc = String::from_str(&env, "Frontend integration");
    let ms1_index = milestone_client.add_milestone(
        &student,
        &proj_id,
        &ms1_title,
        &ms1_desc,
        &1200_i128,
        &reviewer,
    );
    assert_eq!(ms1_index, 1);

    // Verifying milestone count
    assert_eq!(milestone_client.get_milestone_count(&proj_id), 2);

    // Cannot add milestone exceeding goal
    let ms_fail_title = String::from_str(&env, "Fail");
    let ms_fail_desc = String::from_str(&env, "Description");
    let res_fail = milestone_client.try_add_milestone(
        &student,
        &proj_id,
        &ms_fail_title,
        &ms_fail_desc,
        &100_i128,
        &reviewer,
    );
    assert!(res_fail.is_err());

    // 3. Activate project
    core_client.update_project_status(&student, &proj_id, &1_u32); // Active

    // 4. Sponsor project
    escrow_client.sponsor_project(&sponsor, &proj_id, &2000_i128);
    assert_eq!(escrow_client.get_project_total_escrow(&proj_id), 2000_i128);

    // 5. Submit Milestone 0
    let proof0 = String::from_str(&env, "https://github.com/edufundx/proof0");
    milestone_client.submit_milestone(&student, &proj_id, &0, &proof0);

    let ms0: MilestoneInfo = milestone_client.get_milestone(&proj_id, &0);
    assert_eq!(ms0.status, MilestoneStatus::Submitted);
    assert_eq!(ms0.proof_url, proof0);

    // 6. Reviewer approves Milestone 0
    milestone_client.review_milestone(&reviewer, &proj_id, &0, &true);

    let ms0_approved: MilestoneInfo = milestone_client.get_milestone(&proj_id, &0);
    assert_eq!(ms0_approved.status, MilestoneStatus::Approved);

    // Verify funds release (800 XLM released to student, 1200 left in escrow)
    let token_client = token::Client::new(&env, &token_id);
    assert_eq!(token_client.balance(&student), 800_i128);
    assert_eq!(token_client.balance(&escrow_client.address), 1200_i128);
    assert_eq!(escrow_client.get_project_total_escrow(&proj_id), 1200_i128);
    assert_eq!(escrow_client.get_project_released(&proj_id), 800_i128);

    // Student reputation should have been updated (+20 score for milestone approval + 5 for creation = 25)
    let student_rep = rep_client.get_student_reputation(&student);
    assert_eq!(student_rep.score, 25);
    assert_eq!(student_rep.milestones_completed, 1);

    // 7. Submit Milestone 1
    let proof1 = String::from_str(&env, "https://github.com/edufundx/proof1");
    milestone_client.submit_milestone(&student, &proj_id, &1, &proof1);

    // 8. Reviewer approves Milestone 1
    milestone_client.review_milestone(&reviewer, &proj_id, &1, &true);

    let ms1_approved: MilestoneInfo = milestone_client.get_milestone(&proj_id, &1);
    assert_eq!(ms1_approved.status, MilestoneStatus::Approved);

    // Remaining funds released (1200 XLM released, total student balance = 2000)
    assert_eq!(token_client.balance(&student), 2000_i128);
    assert_eq!(token_client.balance(&escrow_client.address), 0_i128);
    assert_eq!(escrow_client.get_project_total_escrow(&proj_id), 0_i128);
    assert_eq!(escrow_client.get_project_released(&proj_id), 2000_i128);

    // Student reputation updated (+20 for milestone, +50 for project completion = 25 + 70 = 95)
    let student_rep_final = rep_client.get_student_reputation(&student);
    assert_eq!(student_rep_final.score, 95);
    assert_eq!(student_rep_final.projects_completed, 1);
    assert_eq!(student_rep_final.milestones_completed, 2);

    // Project registry should mark project as Completed (3 = Completed)
    let project = core_client.get_project(&proj_id);
    assert_eq!(project.status, edufundx_core::storage::ProjectStatus::Completed);
}
