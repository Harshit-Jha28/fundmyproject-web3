#![cfg(test)]
extern crate std;

use crate::{EduFundXReputation, EduFundXReputationClient};
use soroban_sdk::{testutils::Address as _, Address, Env};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn setup() -> (Env, EduFundXReputationClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EduFundXReputation, ());
    let client = EduFundXReputationClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let core = Address::generate(&env);

    client.initialize(&admin, &core);

    (env, client, admin, core)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[test]
fn test_record_contribution_updates_score() {
    let (env, client, _admin, core) = setup();
    let sponsor = Address::generate(&env);

    // First contribution → +10 score
    client.record_contribution(&core, &sponsor, &1000_i128, &1_u64);
    let rep = client.get_sponsor_reputation(&sponsor);
    assert_eq!(rep.score, 10);
    assert_eq!(rep.total_contributed, 1000);
    assert_eq!(rep.contributions_count, 1);
    assert_eq!(rep.projects_sponsored, 1);

    // Second contribution → +10 more
    client.record_contribution(&core, &sponsor, &2500_i128, &2_u64);
    let rep = client.get_sponsor_reputation(&sponsor);
    assert_eq!(rep.score, 20);
    assert_eq!(rep.total_contributed, 3500);
    assert_eq!(rep.contributions_count, 2);
    assert_eq!(rep.projects_sponsored, 2);
}

#[test]
fn test_only_core_can_mutate() {
    let (env, client, _admin, _core) = setup();
    let fake_caller = Address::generate(&env);
    let student = Address::generate(&env);

    // Attempt record_project_created from a non-core address
    let result = client.try_record_project_created(&fake_caller, &student);
    assert!(result.is_err());

    // Attempt record_contribution from a non-core address
    let sponsor = Address::generate(&env);
    let result = client.try_record_contribution(&fake_caller, &sponsor, &100_i128, &1_u64);
    assert!(result.is_err());

    // Attempt record_milestone_completion from a non-core address
    let result = client.try_record_milestone_completion(&fake_caller, &student, &1_u64);
    assert!(result.is_err());

    // Attempt record_project_completion from a non-core address
    let result = client.try_record_project_completion(&fake_caller, &student, &1_u64);
    assert!(result.is_err());
}

#[test]
fn test_project_completion_bonus() {
    let (env, client, _admin, core) = setup();
    let student = Address::generate(&env);

    // Create project → +5
    client.record_project_created(&core, &student);
    let rep = client.get_student_reputation(&student);
    assert_eq!(rep.score, 5);
    assert_eq!(rep.projects_created, 1);

    // Complete milestone → +20
    client.record_milestone_completion(&core, &student, &1_u64);
    let rep = client.get_student_reputation(&student);
    assert_eq!(rep.score, 25);
    assert_eq!(rep.milestones_completed, 1);

    // Complete another milestone → +20
    client.record_milestone_completion(&core, &student, &1_u64);
    let rep = client.get_student_reputation(&student);
    assert_eq!(rep.score, 45);
    assert_eq!(rep.milestones_completed, 2);

    // Complete project → +50 bonus
    client.record_project_completion(&core, &student, &1_u64);
    let rep = client.get_student_reputation(&student);
    assert_eq!(rep.score, 95);
    assert_eq!(rep.projects_completed, 1);
}

#[test]
fn test_cannot_initialize_twice() {
    let (env, client, admin, core) = setup();

    let result = client.try_initialize(&admin, &core);
    assert!(result.is_err());
}

#[test]
fn test_default_reputation_is_zero() {
    let (env, client, _admin, _core) = setup();
    let unknown_student = Address::generate(&env);
    let unknown_sponsor = Address::generate(&env);

    let srep = client.get_student_reputation(&unknown_student);
    assert_eq!(srep.score, 0);
    assert_eq!(srep.projects_created, 0);

    let sprep = client.get_sponsor_reputation(&unknown_sponsor);
    assert_eq!(sprep.score, 0);
    assert_eq!(sprep.total_contributed, 0);
}
