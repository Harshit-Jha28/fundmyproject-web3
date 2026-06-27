use soroban_sdk::{symbol_short, Address, Env};

pub fn emit_project_created_rep(env: &Env, student: &Address, new_score: u64) {
    env.events()
        .publish((symbol_short!("proj_crt"), student.clone()), new_score);
}

pub fn emit_contribution_rep(env: &Env, sponsor: &Address, new_score: u64, project_id: u64) {
    env.events().publish(
        (symbol_short!("contrib"), sponsor.clone()),
        (new_score, project_id),
    );
}

pub fn emit_milestone_rep(env: &Env, student: &Address, new_score: u64, project_id: u64) {
    env.events().publish(
        (symbol_short!("ms_comp"), student.clone()),
        (new_score, project_id),
    );
}

pub fn emit_project_completion_rep(env: &Env, student: &Address, new_score: u64, project_id: u64) {
    env.events().publish(
        (symbol_short!("prj_comp"), student.clone()),
        (new_score, project_id),
    );
}

pub fn emit_initialized(env: &Env, admin: &Address, core: &Address) {
    env.events()
        .publish((symbol_short!("init"), admin.clone()), core.clone());
}
