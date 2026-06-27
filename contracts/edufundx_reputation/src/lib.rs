#![no_std]

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env};

mod errors;
mod events;
pub mod storage;

#[cfg(test)]
mod test;

use errors::ContractError;
use storage::{
    extend_instance_ttl, get_admin, get_core_contract, get_sponsor_rep, get_student_rep,
    has_admin, set_admin, set_core_contract, set_sponsor_rep, set_student_rep, SponsorReputation,
    StudentReputation,
};

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct EduFundXReputation;

#[contractimpl]
impl EduFundXReputation {
    // ----- Initialization --------------------------------------------------

    /// One-time setup. Stores the `admin` and the `core_contract_id` that is
    /// allowed to mutate reputation data.
    pub fn initialize(
        env: Env,
        admin: Address,
        core_contract_id: Address,
    ) -> Result<(), ContractError> {
        if has_admin(&env) {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();

        set_admin(&env, &admin);
        set_core_contract(&env, &core_contract_id);

        events::emit_initialized(&env, &admin, &core_contract_id);
        extend_instance_ttl(&env);
        Ok(())
    }

    // ----- Mutation (core-only) --------------------------------------------

    /// Called by the core contract when a student creates a new project.
    /// Awards **+5** reputation score.
    pub fn record_project_created(
        env: Env,
        caller: Address,
        student: Address,
    ) -> Result<(), ContractError> {
        caller.require_auth();
        Self::require_core(&env, &caller)?;

        let mut rep = get_student_rep(&env, &student);
        rep.score += 5;
        rep.projects_created += 1;
        set_student_rep(&env, &student, &rep);

        events::emit_project_created_rep(&env, &student, rep.score);
        extend_instance_ttl(&env);
        Ok(())
    }

    /// Called by the core contract when a sponsor contributes funds.
    /// Awards **+10** reputation score to the sponsor.
    pub fn record_contribution(
        env: Env,
        caller: Address,
        sponsor: Address,
        amount: i128,
        project_id: u64,
    ) -> Result<(), ContractError> {
        caller.require_auth();
        Self::require_core(&env, &caller)?;

        let mut rep = get_sponsor_rep(&env, &sponsor);
        rep.score += 10;
        rep.total_contributed += amount;
        rep.contributions_count += 1;
        rep.projects_sponsored += 1;
        set_sponsor_rep(&env, &sponsor, &rep);

        events::emit_contribution_rep(&env, &sponsor, rep.score, project_id);
        extend_instance_ttl(&env);
        Ok(())
    }

    /// Called by the core contract when a milestone is approved.
    /// Awards **+20** reputation score to the student.
    pub fn record_milestone_completion(
        env: Env,
        caller: Address,
        student: Address,
        project_id: u64,
    ) -> Result<(), ContractError> {
        caller.require_auth();
        Self::require_core(&env, &caller)?;

        let mut rep = get_student_rep(&env, &student);
        rep.score += 20;
        rep.milestones_completed += 1;
        set_student_rep(&env, &student, &rep);

        events::emit_milestone_rep(&env, &student, rep.score, project_id);
        extend_instance_ttl(&env);
        Ok(())
    }

    /// Called by the core contract when all milestones of a project are
    /// approved. Awards a **+50** bonus to the student.
    pub fn record_project_completion(
        env: Env,
        caller: Address,
        student: Address,
        project_id: u64,
    ) -> Result<(), ContractError> {
        caller.require_auth();
        Self::require_core(&env, &caller)?;

        let mut rep = get_student_rep(&env, &student);
        rep.score += 50;
        rep.projects_completed += 1;
        set_student_rep(&env, &student, &rep);

        events::emit_project_completion_rep(&env, &student, rep.score, project_id);
        extend_instance_ttl(&env);
        Ok(())
    }

    // ----- View functions --------------------------------------------------

    pub fn get_student_reputation(env: Env, student: Address) -> StudentReputation {
        get_student_rep(&env, &student)
    }

    pub fn get_sponsor_reputation(env: Env, sponsor: Address) -> SponsorReputation {
        get_sponsor_rep(&env, &sponsor)
    }

    // ----- Admin -----------------------------------------------------------

    /// Upgrade the contract WASM. Admin-only.
    pub fn upgrade(
        env: Env,
        admin: Address,
        new_wasm_hash: BytesN<32>,
    ) -> Result<(), ContractError> {
        admin.require_auth();
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(ContractError::NotAdmin);
        }
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }

    // ----- Internal --------------------------------------------------------

    fn require_core(env: &Env, caller: &Address) -> Result<(), ContractError> {
        let core = get_core_contract(env);
        if *caller != core {
            return Err(ContractError::UnauthorizedCaller);
        }
        Ok(())
    }
}
