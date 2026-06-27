use soroban_sdk::{symbol_short, Address, Env, Symbol};

pub fn emit_initialized(env: &Env, admin: &Address, registry: &Address) {
    env.events().publish(
        (symbol_short!("init"), admin.clone()),
        registry.clone(),
    );
}

pub fn emit_sponsored(env: &Env, project_id: u64, sponsor: &Address, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "sponsored"), sponsor.clone()),
        (project_id, amount),
    );
}

pub fn emit_funds_released(env: &Env, project_id: u64, student: &Address, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "fund_rel"), student.clone()),
        (project_id, amount),
    );
}

pub fn emit_refunded(env: &Env, project_id: u64, sponsor: &Address, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "refunded"), sponsor.clone()),
        (project_id, amount),
    );
}
