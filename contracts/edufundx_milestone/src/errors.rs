use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum MilestoneError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAdmin = 3,
    ProjectNotDraft = 4,
    ProjectNotActive = 5,
    Unauthorized = 6,
    MilestoneNotFound = 7,
    InvalidMilestoneState = 8,
    GoalExceeded = 9,
    EscrowReleaseFailed = 10,
    ReputationError = 11,
    InvalidAmount = 12,
}
