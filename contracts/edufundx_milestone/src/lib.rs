#![no_std]

use soroban_sdk::{contract, contractimpl, contractclient, contracttype, Address, BytesN, Env, String};

mod errors;
mod events;
pub mod storage;

#[cfg(test)]
mod test;

use errors::MilestoneError;
use storage::{
    extend_instance_ttl, get_admin, get_registry_contract, get_escrow_contract,
    get_reputation_contract, get_milestone_count, set_milestone_count,
    get_milestone, set_milestone, has_admin, set_admin, set_registry_contract,
    set_escrow_contract, set_reputation_contract, MilestoneInfo, MilestoneStatus,
};

// ---------------------------------------------------------------------------
// External Interfaces
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProjectInfo {
    pub id: u64,
    pub student: Address,
    pub title: String,
    pub description: String,
    pub category: String,
    pub funding_goal: i128,
    pub total_sponsored: i128,
    pub status: u32, // 0 = Draft, 1 = Active, 2 = FullyFunded, 3 = Completed, 4 = Cancelled
    pub created_at: u64,
}

#[contractclient(name = "RegistryClient")]
pub trait RegistryInterface {
    fn get_project(env: Env, id: u64) -> Result<ProjectInfo, soroban_sdk::Error>;
    fn update_project_status(env: Env, caller: Address, id: u64, status_val: u32) -> Result<(), soroban_sdk::Error>;
    fn record_milestone_completion_rep(
        env: Env,
        caller: Address,
        student: Address,
        project_id: u64,
    ) -> Result<(), soroban_sdk::Error>;
    fn record_project_completion_rep(
        env: Env,
        caller: Address,
        student: Address,
        project_id: u64,
    ) -> Result<(), soroban_sdk::Error>;
}

#[contractclient(name = "EscrowClient")]
pub trait EscrowInterface {
    fn release_milestone_funds(
        env: Env,
        caller: Address,
        project_id: u64,
        student: Address,
        amount: i128,
    ) -> Result<(), soroban_sdk::Error>;
}



// ---------------------------------------------------------------------------
// Contract Implementation
// ---------------------------------------------------------------------------

#[contract]
pub struct EduFundXMilestone;

#[contractimpl]
impl EduFundXMilestone {
    // ----- Initialization --------------------------------------------------

    pub fn initialize(
        env: Env,
        admin: Address,
        registry_contract_id: Address,
        escrow_contract_id: Address,
        reputation_contract_id: Address,
    ) -> Result<(), MilestoneError> {
        if has_admin(&env) {
            return Err(MilestoneError::AlreadyInitialized);
        }
        admin.require_auth();

        set_admin(&env, &admin);
        set_registry_contract(&env, &registry_contract_id);
        set_escrow_contract(&env, &escrow_contract_id);
        set_reputation_contract(&env, &reputation_contract_id);

        events::emit_initialized(&env, &admin, &registry_contract_id);
        extend_instance_ttl(&env);
        Ok(())
    }

    // ----- Milestone Management ---------------------------------------------

    /// Adds a new milestone to a project.
    /// Can only be done by the project student when the project is in Draft status.
    /// Total milestone amounts must not exceed the funding goal.
    pub fn add_milestone(
        env: Env,
        student: Address,
        project_id: u64,
        title: String,
        description: String,
        amount: i128,
        reviewer: Address,
    ) -> Result<u32, MilestoneError> {
        student.require_auth();

        if amount <= 0 {
            return Err(MilestoneError::InvalidAmount);
        }

        // 1. Get project details from Registry contract
        let registry_id = get_registry_contract(&env);
        let registry_client = RegistryClient::new(&env, &registry_id);

        let project_info = registry_client.get_project(&project_id);

        if project_info.student != student {
            return Err(MilestoneError::Unauthorized);
        }

        // Milestones can only be added when project is in Draft
        if project_info.status != 0 { // 0 = Draft
            return Err(MilestoneError::ProjectNotDraft);
        }

        // 2. Validate total milestone funding does not exceed the funding goal
        let current_count = get_milestone_count(&env, project_id);
        let mut total_milestone_amount: i128 = 0;
        for i in 0..current_count {
            if let Ok(ms) = get_milestone(&env, project_id, i) {
                total_milestone_amount += ms.amount;
            }
        }

        if total_milestone_amount + amount > project_info.funding_goal {
            return Err(MilestoneError::GoalExceeded);
        }

        // 3. Save milestone
        let milestone = MilestoneInfo {
            project_id,
            index: current_count,
            title,
            description,
            amount,
            status: MilestoneStatus::Pending,
            proof_url: String::from_str(&env, ""),
            reviewer,
            approved_at: 0,
        };

        set_milestone(&env, project_id, current_count, &milestone);
        set_milestone_count(&env, project_id, current_count + 1);

        events::emit_milestone_added(&env, project_id, current_count, amount, &milestone.reviewer);
        extend_instance_ttl(&env);
        Ok(current_count)
    }

    /// Submit proof of completion for a milestone.
    pub fn submit_milestone(
        env: Env,
        student: Address,
        project_id: u64,
        index: u32,
        proof_url: String,
    ) -> Result<(), MilestoneError> {
        student.require_auth();

        let registry_id = get_registry_contract(&env);
        let registry_client = RegistryClient::new(&env, &registry_id);

        let project_info = registry_client.get_project(&project_id);

        if project_info.student != student {
            return Err(MilestoneError::Unauthorized);
        }

        // Project must be active (or fully funded) to submit milestones
        if project_info.status != 1 && project_info.status != 2 {
            return Err(MilestoneError::ProjectNotActive);
        }

        let mut milestone = get_milestone(&env, project_id, index)?;
        
        // Milestone must be in Pending or Rejected state to submit/resubmit
        if milestone.status != MilestoneStatus::Pending && milestone.status != MilestoneStatus::Rejected {
            return Err(MilestoneError::InvalidMilestoneState);
        }

        milestone.status = MilestoneStatus::Submitted;
        milestone.proof_url = proof_url.clone();

        set_milestone(&env, project_id, index, &milestone);

        events::emit_milestone_submitted(&env, project_id, index, &proof_url);
        extend_instance_ttl(&env);
        Ok(())
    }

    /// Review a milestone (Approve or Reject).
    /// Can only be done by the assigned reviewer or admin.
    /// If approved: releases milestone amount from Escrow, updates student's reputation.
    /// If all milestones are approved: marks project as Completed and updates project completion reputation.
    pub fn review_milestone(
        env: Env,
        reviewer: Address,
        project_id: u64,
        index: u32,
        approved: bool,
    ) -> Result<(), MilestoneError> {
        reviewer.require_auth();

        let mut milestone = get_milestone(&env, project_id, index)?;
        let admin = get_admin(&env);

        if milestone.reviewer != reviewer && reviewer != admin {
            return Err(MilestoneError::Unauthorized);
        }

        if milestone.status != MilestoneStatus::Submitted {
            return Err(MilestoneError::InvalidMilestoneState);
        }

        let registry_id = get_registry_contract(&env);
        let registry_client = RegistryClient::new(&env, &registry_id);

        let project_info = registry_client.get_project(&project_id);

        if approved {
            milestone.status = MilestoneStatus::Approved;
            milestone.approved_at = env.ledger().timestamp();
            set_milestone(&env, project_id, index, &milestone);

            // 1. Release funds from escrow to student
            let escrow_id = get_escrow_contract(&env);
            let escrow_client = EscrowClient::new(&env, &escrow_id);
            escrow_client.release_milestone_funds(
                &env.current_contract_address(),
                &project_id,
                &project_info.student,
                &milestone.amount,
            );

            // 2. Log reputation milestone completion (+20 score via registry contract forwarding)
            registry_client.record_milestone_completion_rep(
                &env.current_contract_address(),
                &project_info.student,
                &project_id,
            );

            events::emit_milestone_approved(&env, project_id, index);

            // 3. Check if all milestones are approved
            let count = get_milestone_count(&env, project_id);
            let mut all_approved = true;
            for i in 0..count {
                if let Ok(ms) = get_milestone(&env, project_id, i) {
                    if ms.status != MilestoneStatus::Approved {
                        all_approved = false;
                        break;
                    }
                }
            }

            if all_approved {
                // Update project status to Completed (3 = Completed)
                registry_client.update_project_status(
                    &env.current_contract_address(),
                    &project_id,
                    &3_u32,
                );

                // Award student project completion bonus (+50 score via registry contract forwarding)
                registry_client.record_project_completion_rep(
                    &env.current_contract_address(),
                    &project_info.student,
                    &project_id,
                );
            }
        } else {
            milestone.status = MilestoneStatus::Rejected;
            set_milestone(&env, project_id, index, &milestone);

            events::emit_milestone_rejected(&env, project_id, index);
        }

        extend_instance_ttl(&env);
        Ok(())
    }

    // ----- View functions --------------------------------------------------

    pub fn get_milestone(env: Env, project_id: u64, index: u32) -> Result<MilestoneInfo, MilestoneError> {
        get_milestone(&env, project_id, index)
    }

    pub fn get_milestone_count(env: Env, project_id: u64) -> u32 {
        get_milestone_count(&env, project_id)
    }

    pub fn get_admin(env: Env) -> Address {
        get_admin(&env)
    }

    // ----- Admin & Maintenance ---------------------------------------------

    /// Upgrade the contract WASM. Admin-only.
    pub fn upgrade(
        env: Env,
        admin: Address,
        new_wasm_hash: BytesN<32>,
    ) -> Result<(), MilestoneError> {
        admin.require_auth();
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(MilestoneError::NotAdmin);
        }
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}
