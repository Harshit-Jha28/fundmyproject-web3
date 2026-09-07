#![no_std]

use soroban_sdk::{contract, contractimpl, contractclient, Address, BytesN, Env, String};

mod errors;
mod events;
pub mod storage;

#[cfg(test)]
mod test;

use errors::CoreContractError;
use storage::{
    extend_instance_ttl, get_admin, get_project, get_project_count, get_reputation_contract,
    get_token_contract, get_platform_fee_bps, has_admin, increment_project_count, set_admin,
    set_project, set_project_count, set_reputation_contract, set_token_contract, set_platform_fee_bps,
    set_escrow_contract, set_milestone_contract, get_escrow_contract, get_milestone_contract,
    has_escrow_contract, has_milestone_contract, Project, ProjectStatus,
};

// Reputation Contract Client Definition

#[contractclient(name = "ReputationClient")]
pub trait ReputationInterface {
    fn record_project_created(
        env: Env,
        caller: Address,
        student: Address,
    ) -> Result<(), soroban_sdk::Error>;

    fn record_contribution(
        env: Env,
        caller: Address,
        sponsor: Address,
        amount: i128,
        project_id: u64,
    ) -> Result<(), soroban_sdk::Error>;

    fn record_milestone_completion(
        env: Env,
        caller: Address,
        student: Address,
        project_id: u64,
    ) -> Result<(), soroban_sdk::Error>;

    fn record_project_completion(
        env: Env,
        caller: Address,
        student: Address,
        project_id: u64,
    ) -> Result<(), soroban_sdk::Error>;
}

// Contract implementation

#[contract]
pub struct EduFundXCore;

#[contractimpl]
impl EduFundXCore {

    pub fn initialize(
        env: Env,
        admin: Address,
        reputation_contract_id: Address,
        token_id: Address,
        platform_fee_bps: u32,
    ) -> Result<(), CoreContractError> {
        if has_admin(&env) {
            return Err(CoreContractError::AlreadyInitialized);
        }
        admin.require_auth();

        set_admin(&env, &admin);
        set_reputation_contract(&env, &reputation_contract_id);
        set_token_contract(&env, &token_id);
        set_platform_fee_bps(&env, platform_fee_bps);
        set_project_count(&env, 0);

        events::emit_initialized(&env, &admin, &reputation_contract_id);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn create_project(
        env: Env,
        student: Address,
        title: String,
        description: String,
        category: String,
        funding_goal: i128,
    ) -> Result<u64, CoreContractError> {
        student.require_auth();

        if funding_goal <= 0 {
            return Err(CoreContractError::InvalidGoal);
        }

        let project_id = increment_project_count(&env);
        let project = Project {
            id: project_id,
            student: student.clone(),
            title,
            description,
            category: category.clone(),
            funding_goal,
            total_sponsored: 0,
            status: ProjectStatus::Draft,
            created_at: env.ledger().timestamp(),
        };

        set_project(&env, project_id, &project);

        // Notify reputation contract about project creation.
        let rep_contract_id = get_reputation_contract(&env);
        let rep_client = ReputationClient::new(&env, &rep_contract_id);
        
        rep_client.record_project_created(&env.current_contract_address(), &student);

        events::emit_project_created(&env, project_id, &student, funding_goal, &category);
        extend_instance_ttl(&env);
        Ok(project_id)
    }

    /// Updates details of an existing project.
    pub fn update_project(
        env: Env,
        student: Address,
        id: u64,
        title: String,
        description: String,
        category: String,
        funding_goal: i128,
    ) -> Result<(), CoreContractError> {
        student.require_auth();

        let mut project = get_project(&env, id)?;

        if project.student != student {
            return Err(CoreContractError::Unauthorized);
        }
        if project.status != ProjectStatus::Draft {
            return Err(CoreContractError::InvalidStatusTransition);
        }

        if funding_goal <= 0 {
            return Err(CoreContractError::InvalidGoal);
        }

        project.title = title;
        project.description = description;
        project.category = category.clone();
        project.funding_goal = funding_goal;

        set_project(&env, id, &project);

        events::emit_project_updated(&env, id, funding_goal, &category);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn update_project_status(
        env: Env,
        caller: Address,
        id: u64,
        status_val: u32,
    ) -> Result<(), CoreContractError> {
        caller.require_auth();

        let mut project = get_project(&env, id)?;
        let new_status = match status_val {
            0 => ProjectStatus::Draft,
            1 => ProjectStatus::Active,
            2 => ProjectStatus::FullyFunded,
            3 => ProjectStatus::Completed,
            4 => ProjectStatus::Cancelled,
            _ => return Err(CoreContractError::InvalidStatusTransition),
        };

        if project.status == new_status {
            return Ok(());
        }

      
        match (project.status, new_status) {
           
            (ProjectStatus::Draft, ProjectStatus::Active) => {
                if project.student != caller {
                    return Err(CoreContractError::Unauthorized);
                }
            }
            (_, ProjectStatus::Cancelled) => {
                let admin = get_admin(&env);
                if caller != admin {
                    return Err(CoreContractError::Unauthorized);
                }
            }
            _ => {
                let admin = get_admin(&env);
                let is_escrow = has_escrow_contract(&env) && caller == get_escrow_contract(&env);
                let is_milestone = has_milestone_contract(&env) && caller == get_milestone_contract(&env);
                if caller != admin && project.student != caller && !is_escrow && !is_milestone {
                    return Err(CoreContractError::Unauthorized);
                }
            }
        }

        let old_status = project.status;
        project.status = new_status;
        set_project(&env, id, &project);

        events::emit_status_updated(&env, id, old_status, new_status);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn get_project(env: Env, id: u64) -> Result<Project, CoreContractError> {
        get_project(&env, id)
    }

    pub fn get_project_count(env: Env) -> u64 {
        get_project_count(&env)
    }

    pub fn get_reputation_contract(env: Env) -> Address {
        get_reputation_contract(&env)
    }

    pub fn get_token_contract(env: Env) -> Address {
        get_token_contract(&env)
    }

    pub fn get_platform_fee_bps(env: Env) -> u32 {
        get_platform_fee_bps(&env)
    }

    pub fn get_admin(env: Env) -> Address {
        get_admin(&env)
    }

    pub fn set_escrow_contract(env: Env, admin: Address, escrow: Address) -> Result<(), CoreContractError> {
        admin.require_auth();
        if admin != get_admin(&env) {
            return Err(CoreContractError::NotAdmin);
        }
        set_escrow_contract(&env, &escrow);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn set_milestone_contract(env: Env, admin: Address, milestone: Address) -> Result<(), CoreContractError> {
        admin.require_auth();
        if admin != get_admin(&env) {
            return Err(CoreContractError::NotAdmin);
        }
        set_milestone_contract(&env, &milestone);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn get_escrow_contract(env: Env) -> Address {
        get_escrow_contract(&env)
    }

    pub fn get_milestone_contract(env: Env) -> Address {
        get_milestone_contract(&env)
    }

    pub fn get_projects_by_owner(env: Env, owner: Address) -> soroban_sdk::Vec<Project> {
        let count = get_project_count(&env);
        let mut result = soroban_sdk::Vec::new(&env);
        for i in 1..=count {
            if let Ok(project) = get_project(&env, i) {
                if project.student == owner {
                    result.push_back(project);
                }
            }
        }
        result
    }


    pub fn record_contribution_rep(
        env: Env,
        caller: Address,
        sponsor: Address,
        amount: i128,
        project_id: u64,
    ) -> Result<(), CoreContractError> {
        caller.require_auth();
        let escrow = get_escrow_contract(&env);
        if caller != escrow {
            return Err(CoreContractError::Unauthorized);
        }

        let rep_id = get_reputation_contract(&env);
        let rep_client = ReputationClient::new(&env, &rep_id);
        rep_client.record_contribution(&env.current_contract_address(), &sponsor, &amount, &project_id);

        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn record_milestone_completion_rep(
        env: Env,
        caller: Address,
        student: Address,
        project_id: u64,
    ) -> Result<(), CoreContractError> {
        caller.require_auth();
        let milestone = get_milestone_contract(&env);
        if caller != milestone {
            return Err(CoreContractError::Unauthorized);
        }

        let rep_id = get_reputation_contract(&env);
        let rep_client = ReputationClient::new(&env, &rep_id);
        rep_client.record_milestone_completion(&env.current_contract_address(), &student, &project_id);

        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn record_project_completion_rep(
        env: Env,
        caller: Address,
        student: Address,
        project_id: u64,
    ) -> Result<(), CoreContractError> {
        caller.require_auth();
        let milestone = get_milestone_contract(&env);
        if caller != milestone {
            return Err(CoreContractError::Unauthorized);
        }

        let rep_id = get_reputation_contract(&env);
        let rep_client = ReputationClient::new(&env, &rep_id);
        rep_client.record_project_completion(&env.current_contract_address(), &student, &project_id);

        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn upgrade(
        env: Env,
        admin: Address,
        new_wasm_hash: BytesN<32>,
    ) -> Result<(), CoreContractError> {
        admin.require_auth();
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(CoreContractError::NotAdmin);
        }
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}
