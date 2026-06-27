use soroban_sdk::{symbol_short, Address, Env, String, Symbol};
use crate::storage::ProjectStatus;

pub fn emit_initialized(env: &Env, admin: &Address, reputation: &Address) {
    env.events().publish(
        (symbol_short!("init"), admin.clone()),
        reputation.clone(),
    );
}

pub fn emit_project_created(env: &Env, id: u64, student: &Address, goal: i128, category: &String) {
    env.events().publish(
        (Symbol::new(env, "proj_create"), student.clone()),
        (id, goal, category.clone()),
    );
}

pub fn emit_project_updated(env: &Env, id: u64, goal: i128, category: &String) {
    env.events().publish(
        (Symbol::new(env, "proj_update"), id),
        (goal, category.clone()),
    );
}

pub fn emit_status_updated(env: &Env, id: u64, old_status: ProjectStatus, new_status: ProjectStatus) {
    env.events().publish(
        (Symbol::new(env, "status_upd"), id),
        (old_status as u32, new_status as u32),
    );
}
