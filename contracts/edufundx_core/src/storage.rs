use soroban_sdk::{contracttype, Address, Env, String};
use crate::errors::CoreContractError;

const PERSISTENT_TTL_THRESHOLD: u32 = 1000;
const PERSISTENT_TTL_EXTEND: u32 = 5000;
const INSTANCE_TTL_THRESHOLD: u32 = 1000;
const INSTANCE_TTL_EXTEND: u32 = 5000;

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ProjectStatus {
    Draft = 0,
    Active = 1,
    FullyFunded = 2,
    Completed = 3,
    Cancelled = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Project {
    pub id: u64,
    pub student: Address,
    pub title: String,
    pub description: String,
    pub category: String,
    pub funding_goal: i128,
    pub total_sponsored: i128,
    pub status: ProjectStatus,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    ReputationContract,
    TokenContract,
    PlatformFeeBps,
    ProjectCount,
    Project(u64),
    EscrowContract,
    MilestoneContract,
}

// Instance Helpers
pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_reputation_contract(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::ReputationContract).unwrap()
}

pub fn set_reputation_contract(env: &Env, reputation: &Address) {
    env.storage().instance().set(&DataKey::ReputationContract, reputation);
}

pub fn get_token_contract(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::TokenContract).unwrap()
}

pub fn set_token_contract(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::TokenContract, token);
}

pub fn get_platform_fee_bps(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::PlatformFeeBps).unwrap()
}

pub fn set_platform_fee_bps(env: &Env, fee: u32) {
    env.storage().instance().set(&DataKey::PlatformFeeBps, &fee);
}

pub fn get_escrow_contract(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::EscrowContract).unwrap()
}

pub fn set_escrow_contract(env: &Env, escrow: &Address) {
    env.storage().instance().set(&DataKey::EscrowContract, escrow);
}

pub fn get_milestone_contract(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::MilestoneContract).unwrap()
}

pub fn set_milestone_contract(env: &Env, milestone: &Address) {
    env.storage().instance().set(&DataKey::MilestoneContract, milestone);
}

pub fn has_escrow_contract(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::EscrowContract)
}

pub fn has_milestone_contract(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::MilestoneContract)
}

pub fn get_project_count(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::ProjectCount).unwrap_or(0)
}

pub fn set_project_count(env: &Env, count: u64) {
    env.storage().instance().set(&DataKey::ProjectCount, &count);
}

pub fn increment_project_count(env: &Env) -> u64 {
    let count = get_project_count(env) + 1;
    set_project_count(env, count);
    count
}

pub fn extend_instance_ttl(env: &Env) {
    env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND);
}

// Persistent Helpers
pub fn get_project(env: &Env, id: u64) -> Result<Project, CoreContractError> {
    let key = DataKey::Project(id);
    if !env.storage().persistent().has(&key) {
        return Err(CoreContractError::ProjectNotFound);
    }
    let project: Project = env.storage().persistent().get(&key).unwrap();
    env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
    Ok(project)
}

pub fn set_project(env: &Env, id: u64, project: &Project) {
    let key = DataKey::Project(id);
    env.storage().persistent().set(&key, project);
    env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
}

pub fn has_project(env: &Env, id: u64) -> bool {
    let key = DataKey::Project(id);
    env.storage().persistent().has(&key)
}
