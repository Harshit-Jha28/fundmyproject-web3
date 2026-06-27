use soroban_sdk::{contracttype, Address, Env};

const PERSISTENT_TTL_THRESHOLD: u32 = 1000;
const PERSISTENT_TTL_EXTEND: u32 = 5000;
const INSTANCE_TTL_THRESHOLD: u32 = 1000;
const INSTANCE_TTL_EXTEND: u32 = 5000;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    RegistryContract,
    TokenContract,
    ReputationContract,
    MilestoneContract,
    Sponsorship(u64, Address),
    ProjectTotalEscrow(u64),
    ProjectReleased(u64),
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

pub fn get_token_contract(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::TokenContract).unwrap()
}

pub fn set_token_contract(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::TokenContract, token);
}

pub fn get_reputation_contract(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::ReputationContract).unwrap()
}

pub fn set_reputation_contract(env: &Env, reputation: &Address) {
    env.storage().instance().set(&DataKey::ReputationContract, reputation);
}

pub fn get_milestone_contract(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::MilestoneContract).unwrap()
}

pub fn set_milestone_contract(env: &Env, milestone: &Address) {
    env.storage().instance().set(&DataKey::MilestoneContract, milestone);
}

pub fn extend_instance_ttl(env: &Env) {
    env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND);
}

// Persistent Helpers
pub fn get_sponsorship(env: &Env, project_id: u64, sponsor: &Address) -> i128 {
    let key = DataKey::Sponsorship(project_id, sponsor.clone());
    let amt = env.storage().persistent().get(&key).unwrap_or(0_i128);
    if env.storage().persistent().has(&key) {
        env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
    }
    amt
}

pub fn set_sponsorship(env: &Env, project_id: u64, sponsor: &Address, amount: i128) {
    let key = DataKey::Sponsorship(project_id, sponsor.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
}

pub fn get_project_total_escrow(env: &Env, project_id: u64) -> i128 {
    let key = DataKey::ProjectTotalEscrow(project_id);
    let amt = env.storage().persistent().get(&key).unwrap_or(0_i128);
    if env.storage().persistent().has(&key) {
        env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
    }
    amt
}

pub fn set_project_total_escrow(env: &Env, project_id: u64, amount: i128) {
    let key = DataKey::ProjectTotalEscrow(project_id);
    env.storage().persistent().set(&key, &amount);
    env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
}

pub fn get_project_released(env: &Env, project_id: u64) -> i128 {
    let key = DataKey::ProjectReleased(project_id);
    let amt = env.storage().persistent().get(&key).unwrap_or(0_i128);
    if env.storage().persistent().has(&key) {
        env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
    }
    amt
}

pub fn set_project_released(env: &Env, project_id: u64, amount: i128) {
    let key = DataKey::ProjectReleased(project_id);
    env.storage().persistent().set(&key, &amount);
    env.storage().persistent().extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
}
