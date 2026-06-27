use soroban_sdk::{contracttype, Address, Env};

const PERSISTENT_TTL_THRESHOLD: u32 = 1000;
const PERSISTENT_TTL_EXTEND: u32 = 5000;
const INSTANCE_TTL_THRESHOLD: u32 = 1000;
const INSTANCE_TTL_EXTEND: u32 = 5000;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StudentReputation {
    pub score: u64,
    pub projects_created: u32,
    pub projects_completed: u32,
    pub milestones_completed: u32,
    pub total_funded_received: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SponsorReputation {
    pub score: u64,
    pub projects_sponsored: u32,
    pub total_contributed: i128,
    pub contributions_count: u32,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    CoreContract,
    StudentRep(Address),
    SponsorRep(Address),
}

// ---------------------------------------------------------------------------
// Instance storage helpers
// ---------------------------------------------------------------------------

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_core_contract(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::CoreContract)
        .unwrap()
}

pub fn set_core_contract(env: &Env, core: &Address) {
    env.storage().instance().set(&DataKey::CoreContract, core);
}

pub fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND);
}

// ---------------------------------------------------------------------------
// Persistent storage helpers — student reputation
// ---------------------------------------------------------------------------

pub fn get_student_rep(env: &Env, student: &Address) -> StudentReputation {
    let key = DataKey::StudentRep(student.clone());
    let rep = env.storage().persistent().get(&key).unwrap_or(StudentReputation {
        score: 0,
        projects_created: 0,
        projects_completed: 0,
        milestones_completed: 0,
        total_funded_received: 0,
    });
    if env.storage().persistent().has(&key) {
        env.storage()
            .persistent()
            .extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
    }
    rep
}

pub fn set_student_rep(env: &Env, student: &Address, rep: &StudentReputation) {
    let key = DataKey::StudentRep(student.clone());
    env.storage().persistent().set(&key, rep);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
}

// ---------------------------------------------------------------------------
// Persistent storage helpers — sponsor reputation
// ---------------------------------------------------------------------------

pub fn get_sponsor_rep(env: &Env, sponsor: &Address) -> SponsorReputation {
    let key = DataKey::SponsorRep(sponsor.clone());
    let rep = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or(SponsorReputation {
            score: 0,
            projects_sponsored: 0,
            total_contributed: 0,
            contributions_count: 0,
        });
    if env.storage().persistent().has(&key) {
        env.storage()
            .persistent()
            .extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
    }
    rep
}

pub fn set_sponsor_rep(env: &Env, sponsor: &Address, rep: &SponsorReputation) {
    let key = DataKey::SponsorRep(sponsor.clone());
    env.storage().persistent().set(&key, rep);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND);
}
