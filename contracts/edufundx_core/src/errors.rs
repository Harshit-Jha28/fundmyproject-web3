use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum CoreContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAdmin = 3,
    ProjectNotFound = 4,
    Unauthorized = 5,
    InvalidGoal = 6,
    InvalidStatusTransition = 7,
    ReputationError = 8,
}
