use soroban_sdk::{symbol_short, Address, Env, String, Symbol};

pub fn emit_initialized(env: &Env, admin: &Address, registry: &Address) {
    env.events().publish(
        (symbol_short!("init"), admin.clone()),
        registry.clone(),
    );
}

pub fn emit_milestone_added(env: &Env, project_id: u64, index: u32, amount: i128, reviewer: &Address) {
    env.events().publish(
        (Symbol::new(env, "ms_added"), project_id),
        (index, amount, reviewer.clone()),
    );
}

pub fn emit_milestone_submitted(env: &Env, project_id: u64, index: u32, proof_url: &String) {
    env.events().publish(
        (Symbol::new(env, "ms_submit"), project_id),
        (index, proof_url.clone()),
    );
}

pub fn emit_milestone_approved(env: &Env, project_id: u64, index: u32) {
    env.events().publish(
        (Symbol::new(env, "ms_appr"), project_id),
        index,
    );
}

pub fn emit_milestone_rejected(env: &Env, project_id: u64, index: u32) {
    env.events().publish(
        (Symbol::new(env, "ms_rej"), project_id),
        index,
    );
}
