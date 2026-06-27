use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum EscrowError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAdmin = 3,
    ProjectNotActive = 4,
    ProjectCancelled = 5,
    ProjectCompleted = 6,
    InsufficientEscrow = 7,
    ReputationError = 8,
    Unauthorized = 9,
    InvalidAmount = 10,
}
