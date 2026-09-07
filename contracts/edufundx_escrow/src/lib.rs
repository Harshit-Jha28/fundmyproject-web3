#![no_std]

use soroban_sdk::{contract, contractimpl, contractclient, contracttype, token, Address, BytesN, Env, String};

mod errors;
mod events;
pub mod storage;

#[cfg(test)]
mod test;

use errors::EscrowError;
use storage::{
    extend_instance_ttl, get_admin, get_registry_contract, get_token_contract,
    get_reputation_contract, get_milestone_contract, get_sponsorship,
    get_project_total_escrow, get_project_released, has_admin, set_admin,
    set_registry_contract, set_token_contract, set_reputation_contract,
    set_milestone_contract, set_sponsorship, set_project_total_escrow,
    set_project_released,
};

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
    pub status: u32,
    pub created_at: u64,
}

#[contractclient(name = "RegistryClient")]
pub trait RegistryInterface {
    fn get_project(env: Env, id: u64) -> Result<ProjectInfo, soroban_sdk::Error>;
    fn update_project_status(env: Env, caller: Address, id: u64, status_val: u32) -> Result<(), soroban_sdk::Error>;
    fn record_contribution_rep(
        env: Env,
        caller: Address,
        sponsor: Address,
        amount: i128,
        project_id: u64,
    ) -> Result<(), soroban_sdk::Error>;
}

#[contract]
pub struct EduFundXEscrow;

#[contractimpl]
impl EduFundXEscrow {

    pub fn initialize(
        env: Env,
        admin: Address,
        registry_contract_id: Address,
        token_contract_id: Address,
        reputation_contract_id: Address,
        milestone_contract_id: Address,
    ) -> Result<(), EscrowError> {
        if has_admin(&env) {
            return Err(EscrowError::AlreadyInitialized);
        }
        admin.require_auth();

        set_admin(&env, &admin);
        set_registry_contract(&env, &registry_contract_id);
        set_token_contract(&env, &token_contract_id);
        set_reputation_contract(&env, &reputation_contract_id);
        set_milestone_contract(&env, &milestone_contract_id);

        events::emit_initialized(&env, &admin, &registry_contract_id);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn sponsor_project(
        env: Env,
        sponsor: Address,
        project_id: u64,
        amount: i128,
    ) -> Result<(), EscrowError> {
        sponsor.require_auth();

        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }

        let registry_id = get_registry_contract(&env);
        let registry_client = RegistryClient::new(&env, &registry_id);
        
        let project_info = registry_client.get_project(&project_id);

        if project_info.status != 1 { 
            return Err(EscrowError::ProjectNotActive);
        }

        let token_id = get_token_contract(&env);
        let token_client = token::Client::new(&env, &token_id);
        token_client.transfer(&sponsor, &env.current_contract_address(), &amount);

        let current_sponsorship = get_sponsorship(&env, project_id, &sponsor);
        set_sponsorship(&env, project_id, &sponsor, current_sponsorship + amount);

        let total_escrow = get_project_total_escrow(&env, project_id);
        let new_total_escrow = total_escrow + amount;
        set_project_total_escrow(&env, project_id, new_total_escrow);

    
        if new_total_escrow >= project_info.funding_goal {
           
            let _ = registry_client.update_project_status(&env.current_contract_address(), &project_id, &2_u32);
        }

        registry_client.record_contribution_rep(&env.current_contract_address(), &sponsor, &amount, &project_id);

        events::emit_sponsored(&env, project_id, &sponsor, amount);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn release_milestone_funds(
        env: Env,
        caller: Address,
        project_id: u64,
        student: Address,
        amount: i128,
    ) -> Result<(), EscrowError> {
        caller.require_auth();

        let milestone_id = get_milestone_contract(&env);
        if caller != milestone_id {
            return Err(EscrowError::Unauthorized);
        }

        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }

        let total_escrow = get_project_total_escrow(&env, project_id);
        if total_escrow < amount {
            return Err(EscrowError::InsufficientEscrow);
        }

        // Transfer funds from escrow to student
        let token_id = get_token_contract(&env);
        let token_client = token::Client::new(&env, &token_id);
        token_client.transfer(&env.current_contract_address(), &student, &amount);

        set_project_total_escrow(&env, project_id, total_escrow - amount);
        let released = get_project_released(&env, project_id);
        set_project_released(&env, project_id, released + amount);

        events::emit_funds_released(&env, project_id, &student, amount);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn refund_sponsor(
        env: Env,
        sponsor: Address,
        project_id: u64,
    ) -> Result<(), EscrowError> {
        sponsor.require_auth();

        let registry_id = get_registry_contract(&env);
        let registry_client = RegistryClient::new(&env, &registry_id);

        let project_info = registry_client.get_project(&project_id);

        if project_info.status != 4 { 
            return Err(EscrowError::ProjectCancelled);
        }

        let sponsored_amt = get_sponsorship(&env, project_id, &sponsor);
        if sponsored_amt <= 0 {
            return Err(EscrowError::InvalidAmount);
        }

        let total_escrow = get_project_total_escrow(&env, project_id);
        if total_escrow < sponsored_amt {
            return Err(EscrowError::InsufficientEscrow);
        }

        // Return funds to sponsor
        let token_id = get_token_contract(&env);
        let token_client = token::Client::new(&env, &token_id);
        token_client.transfer(&env.current_contract_address(), &sponsor, &sponsored_amt);


        set_sponsorship(&env, project_id, &sponsor, 0);
        set_project_total_escrow(&env, project_id, total_escrow - sponsored_amt);

        events::emit_refunded(&env, project_id, &sponsor, sponsored_amt);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn get_sponsorship(env: Env, project_id: u64, sponsor: Address) -> i128 {
        get_sponsorship(&env, project_id, &sponsor)
    }

    pub fn get_project_total_escrow(env: Env, project_id: u64) -> i128 {
        get_project_total_escrow(&env, project_id)
    }

    pub fn get_project_released(env: Env, project_id: u64) -> i128 {
        get_project_released(&env, project_id)
    }

    pub fn get_admin(env: Env) -> Address {
        get_admin(&env)
    }

    pub fn upgrade(
        env: Env,
        admin: Address,
        new_wasm_hash: BytesN<32>,
    ) -> Result<(), EscrowError> {
        admin.require_auth();
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(EscrowError::NotAdmin);
        }
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}
