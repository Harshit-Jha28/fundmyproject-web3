#![cfg(test)]
extern crate std;

use crate::{EduFundXCore, EduFundXCoreClient};
use crate::storage::{ProjectStatus, Project};
use edufundx_reputation::{EduFundXReputation, EduFundXReputationClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup() -> (
    Env,
    EduFundXCoreClient<'static>,
    EduFundXReputationClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    let reputation_id = env.register(EduFundXReputation, ());
    let reputation_client = EduFundXReputationClient::new(&env, &reputation_id);

    let core_id = env.register(EduFundXCore, ());
    let core_client = EduFundXCoreClient::new(&env, &core_id);

    let admin = Address::generate(&env);
    let token = Address::generate(&env);

    core_client.initialize(&admin, &reputation_id, &token, &250_u32);
    reputation_client.initialize(&admin, &core_id);

    (env, core_client, reputation_client, admin, reputation_id, token)
}

#[test]
fn test_initialize() {
    let (_env, core_client, _rep_client, admin, rep_id, token) = setup();

    assert_eq!(core_client.get_admin(), admin);
    assert_eq!(core_client.get_reputation_contract(), rep_id);
    assert_eq!(core_client.get_token_contract(), token);
    assert_eq!(core_client.get_platform_fee_bps(), 250);
    assert_eq!(core_client.get_project_count(), 0);

    // Initializing again should panic
    let result = core_client.try_initialize(&admin, &rep_id, &token, &250);
    assert!(result.is_err());
}

#[test]
fn test_create_project() {
    let (env, core_client, rep_client, _admin, _rep_id, _token) = setup();
    let student = Address::generate(&env);

    let title = String::from_str(&env, "Soroban Hackathon Prototype");
    let desc = String::from_str(&env, "A prototype platform built using Soroban smart contracts.");
    let cat = String::from_str(&env, "Tech");
    let goal = 10000_i128;

    let proj_id = core_client.create_project(&student, &title, &desc, &cat, &goal);
    assert_eq!(proj_id, 1);
    assert_eq!(core_client.get_project_count(), 1);

    let project: Project = core_client.get_project(&proj_id);
    assert_eq!(project.id, 1);
    assert_eq!(project.student, student);
    assert_eq!(project.title, title);
    assert_eq!(project.description, desc);
    assert_eq!(project.category, cat);
    assert_eq!(project.funding_goal, goal);
    assert_eq!(project.total_sponsored, 0);
    assert_eq!(project.status, ProjectStatus::Draft);

    // Reputation contract should be updated with project created reputation (+5 score)
    let rep = rep_client.get_student_reputation(&student);
    assert_eq!(rep.score, 5);
    assert_eq!(rep.projects_created, 1);
}

#[test]
fn test_update_project() {
    let (env, core_client, _rep_client, _admin, _rep_id, _token) = setup();
    let student = Address::generate(&env);

    let title = String::from_str(&env, "Project A");
    let desc = String::from_str(&env, "Description A");
    let cat = String::from_str(&env, "Research");
    let goal = 5000_i128;

    let proj_id = core_client.create_project(&student, &title, &desc, &cat, &goal);

    let new_title = String::from_str(&env, "Project A Updated");
    let new_desc = String::from_str(&env, "Description A Updated");
    let new_cat = String::from_str(&env, "Edu");
    let new_goal = 6000_i128;

    core_client.update_project(&student, &proj_id, &new_title, &new_desc, &new_cat, &new_goal);

    let project: Project = core_client.get_project(&proj_id);
    assert_eq!(project.title, new_title);
    assert_eq!(project.description, new_desc);
    assert_eq!(project.category, new_cat);
    assert_eq!(project.funding_goal, new_goal);

    // Attempting to update status to Active
    core_client.update_project_status(&student, &proj_id, &1_u32); // 1 = Active
    let project_active: Project = core_client.get_project(&proj_id);
    assert_eq!(project_active.status, ProjectStatus::Active);

    // Updating project after it is Active should fail
    let err = core_client.try_update_project(&student, &proj_id, &new_title, &new_desc, &new_cat, &new_goal);
    assert!(err.is_err());
}

#[test]
fn test_update_project_status_authorization() {
    let (env, core_client, _rep_client, admin, _rep_id, _token) = setup();
    let student = Address::generate(&env);
    let rando = Address::generate(&env);

    let title = String::from_str(&env, "Project");
    let desc = String::from_str(&env, "Description");
    let cat = String::from_str(&env, "Research");
    let goal = 5000_i128;

    let proj_id = core_client.create_project(&student, &title, &desc, &cat, &goal);

    // Rando cannot activate the project
    let result = core_client.try_update_project_status(&rando, &proj_id, &1_u32);
    assert!(result.is_err());

    // Student can activate the project
    core_client.update_project_status(&student, &proj_id, &1_u32);
    let project = core_client.get_project(&proj_id);
    assert_eq!(project.status, ProjectStatus::Active);

    // Student cannot cancel the project directly (only admin can cancel)
    let result = core_client.try_update_project_status(&student, &proj_id, &4_u32); // 4 = Cancelled
    assert!(result.is_err());

    // Admin can cancel the project
    core_client.update_project_status(&admin, &proj_id, &4_u32);
    let project = core_client.get_project(&proj_id);
    assert_eq!(project.status, ProjectStatus::Cancelled);
}
