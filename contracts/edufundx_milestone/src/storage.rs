use soroban_sdk::{contracttype, Address, Env, String};
use crate::errors::MilestoneError;

const PERSISTENT_TTL_THRESHOLD: u32 = 1000;
const PERSISTENT_TTL_EXTEND: u32 = 5000;
const INSTANCE_TTL_THRESHOLD: u32 = 1000;
const INSTANCE_TTL_EXTEND: u32 = 5000;

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum MilestoneStatus {
    Pending = 0,
    Submitted = 1,
    Approved = 2,
    Rejected = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneInfo {
    pub project_id: u64,
    pub index: u32,
    pub title: String,
    pub description: String,
    pub amount: i128,
    pub status: MilestoneStatus,
    pub proof_url: String,
    pub reviewer: Address,
    pub approved_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    RegistryContract,
    EscrowContract,
    ReputationContract,
    MilestoneCount(u64),
    Milestone(u64, u32),
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

pub fn get_registry_contract(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::RegistryContract).unwrap()
}

pub fn set_registry_contract(env: &Env, registry: &Address) {
    env.storage().instance().set(&DataKey::RegistryContract, registry);
}

pub fn get_escrow_contract(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::EscrowContract).unwrap()
}

pub fn set_escrow_contract(env: &Env, escrow: &Address) {
    env.storage().instance().set(&DataKey::EscrowContract, escrow);
}

pub fn get_reputation_contract(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::ReputationContract).unwrap()
}

pub fn set_reputation_contract(env: &Env, reputation: &Address) {
    env.storage().instance().set(&DataKey::ReputationContract, reputation);
}

pub fn extend_instance_ttl(env: &Env) {
    env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND);
}

// Persistent Helpers
pub fn get_milestone_count(env: &Env, project_id: u64) -> u32 {
    let key = DataKey::MilestoneCount(project_id);
    let count = env.storage().persistent().get(&key).unwrap_or(0_u32);
    if env.storage().persistent().has(&key) {
        env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
    }
    count
}

pub fn set_milestone_count(env: &Env, project_id: u64, count: u32) {
    let key = DataKey::MilestoneCount(project_id);
    env.storage().persistent().set(&key, &count);
    env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
}

pub fn get_milestone(env: &Env, project_id: u64, index: u32) -> Result<MilestoneInfo, MilestoneError> {
    let key = DataKey::Milestone(project_id, index);
    if !env.storage().persistent().has(&key) {
        return Err(MilestoneError::MilestoneNotFound);
    }
    let ms: MilestoneInfo = env.storage().persistent().get(&key).unwrap();
    env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
    Ok(ms)
}

pub fn set_milestone(env: &Env, project_id: u64, index: u32, ms: &MilestoneInfo) {
    let key = DataKey::Milestone(project_id, index);
    env.storage().persistent().set(&key, ms);
    env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
}
