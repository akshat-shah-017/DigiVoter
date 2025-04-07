use ic_cdk::init;
use candid::{CandidType, Deserialize};
use ic_cdk::api::time;
use ic_cdk::export::candid;
use ic_cdk_timers::set_timer;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
    storable::{Storable, BoundedStorable},
};
use std::cell::RefCell;
use std::collections::HashMap;
use std::time::Duration;
use std::string::ToString;
use std::borrow::Cow;

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
struct StableString(String);

#[allow(dead_code)]
impl StableString {
    fn new(s: String) -> Self {
        StableString(s)
    }
    
    fn as_str(&self) -> &str {
        &self.0
    }
    
    fn into_string(self) -> String {
        self.0
    }
}

impl From<String> for StableString {
    fn from(s: String) -> Self {
        StableString(s)
    }
}

impl From<&str> for StableString {
    fn from(s: &str) -> Self {
        StableString(s.to_string())
    }
}

impl Storable for StableString {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(self.0.as_bytes().to_vec())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        StableString(String::from_utf8(bytes.to_vec()).unwrap())
    }
}

impl BoundedStorable for StableString {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}


#[derive(CandidType, Deserialize, Clone)]
struct Election {
    id: String,
    title: String,
    description: String,
    options: Vec<String>,
    start_time: u64,
    end_time: u64,
    status: String, 
}

#[derive(CandidType, Deserialize, Clone)]
struct Vote {
    election_id: String,
    option_index: u32,
    voter_id: String,
    timestamp: u64,
    verification_hash: String,
}

#[derive(CandidType, Deserialize)]
struct ElectionResult {
    election_id: String,
    title: String,
    options: Vec<String>,
    vote_counts: Vec<u64>,
    total_votes: u64,
}

#[derive(CandidType, Deserialize)]
struct VoteReceipt {
    verification_hash: String,
    timestamp: u64,
}

impl Storable for Election {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for Election {
    const MAX_SIZE: u32 = 2048; 
    const IS_FIXED_SIZE: bool = false;
}


impl Storable for Vote {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for Vote {
    const MAX_SIZE: u32 = 1024; 
    const IS_FIXED_SIZE: bool = false;
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    static ELECTIONS: RefCell<StableBTreeMap<StableString, Election, VirtualMemory<DefaultMemoryImpl>>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static VOTES: RefCell<StableBTreeMap<StableString, Vote, VirtualMemory<DefaultMemoryImpl>>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static VOTER_REGISTRY: RefCell<HashMap<String, Vec<String>>> = RefCell::new(HashMap::new());
    
    static ADMINS: RefCell<std::collections::HashSet<ic_cdk::export::Principal>> = RefCell::new(std::collections::HashSet::new());
}

fn generate_id() -> String {
    let timestamp = time();
    let random = ic_cdk::api::call::arg_data_raw();
    format!("{}-{:?}", timestamp, random)
}

fn generate_verification_hash(election_id: &str, voter_id: &str, option_index: u32) -> String {
    let _data = format!("{}-{}-{}-{}", election_id, voter_id, option_index, time());
    let hash_bytes = ic_cdk::api::call::arg_data_raw();
    format!("{:x}", hash_bytes.iter().fold(0u64, |acc, &x| acc + x as u64))
}


fn end_election_sync(election_id: String) -> bool {
    ELECTIONS.with(|elections| {
        let mut elections_map = elections.borrow_mut();
        
        if let Some(election) = elections_map.get(&StableString::from(election_id.clone())) {
            let mut election_clone = election.clone();
            if election_clone.status == "active" {
                election_clone.status = "completed".to_string();
                elections_map.insert(StableString::from(election_id), election_clone);
                return true;
            }
        }
        false
    })
}


#[ic_cdk::update]
fn create_election(title: String, description: String, options: Vec<String>, start_time: u64, end_time: u64) -> String {
    
    let _caller = ic_cdk::caller();
    let election_id = generate_id();
    
    let election = Election {
        id: election_id.clone(),
        title,
        description,
        options,
        start_time,
        end_time,
        status: "pending".to_string(),
    };
    
    ELECTIONS.with(|elections| {
        elections.borrow_mut().insert(StableString::from(election_id.clone()), election);
    });
    
    
    let current_time = time();
    let max_delay = u64::MAX - current_time;

    
    if start_time > current_time {
        let delay = start_time - current_time;
        if delay < max_delay {
            let election_id_clone = election_id.clone();
            set_timer(Duration::from_nanos(delay), move || {
                start_election(election_id_clone.clone());
            });
        }
    }

    
    if end_time > current_time {
        let delay = end_time - current_time;
        if delay < max_delay {
            let election_id_clone = election_id.clone();
            set_timer(Duration::from_nanos(delay), move || {
                if end_election_sync(election_id_clone.clone()) {
                    ic_cdk::println!("Election ended successfully");
                } else {
                    ic_cdk::println!("Failed to end election");
                }
            });
        }
    }
    
    election_id
}

#[ic_cdk::query]
fn get_elections() -> Vec<Election> {
    ELECTIONS.with(|elections| {
        elections.borrow().iter().map(|(_, election)| election.clone()).collect()
    })
}

#[ic_cdk::query]
fn get_election(election_id: String) -> Option<Election> {
    ELECTIONS.with(|elections| {
        elections.borrow().get(&StableString::from(election_id)).map(|election| election.clone())
    })
}


#[ic_cdk::update]
fn cast_vote(election_id: String, option_index: u32) -> VoteReceipt {
    let caller = ic_cdk::caller().to_string();
    let current_time = time();
    
    
    let election = ELECTIONS.with(|elections| {
        elections.borrow().get(&StableString::from(election_id.clone())).map(|e| e.clone())
    }).expect("Election not found");
    
    assert!(election.status == "active", "Election is not active");
    assert!(current_time >= election.start_time && current_time <= election.end_time, "Election is not open for voting");
    assert!(option_index < election.options.len() as u32, "Invalid option index");
    
    
    VOTER_REGISTRY.with(|registry| {
        let mut registry = registry.borrow_mut();
        let voter_elections = registry.entry(caller.clone()).or_insert_with(Vec::new);
        assert!(!voter_elections.contains(&election_id), "Voter has already cast a vote in this election");
        voter_elections.push(election_id.clone());
    });
    
    
    let verification_hash = generate_verification_hash(&election_id, &caller, option_index);
    let vote = Vote {
        election_id: election_id.clone(),
        option_index,
        voter_id: caller,
        timestamp: current_time,
        verification_hash: verification_hash.clone(),
    };
    
    VOTES.with(|votes| {
        votes.borrow_mut().insert(StableString::from(verification_hash.clone()), vote);
    });
    
    VoteReceipt {
        verification_hash,
        timestamp: current_time,
    }
}

#[ic_cdk::query]
fn verify_vote(verification_hash: String) -> bool {
    VOTES.with(|votes| {
        votes.borrow().contains_key(&StableString::from(verification_hash))
    })
}


#[ic_cdk::query]
fn get_election_results(election_id: String) -> Option<ElectionResult> {
    
    let election = ELECTIONS.with(|elections| {
        elections.borrow().get(&StableString::from(election_id.clone())).map(|e| e.clone())
    })?;
    
    
    if election.status != "completed" {
        return None;
    }
    
    
    let mut vote_counts = vec![0u64; election.options.len()];
    let mut total_votes = 0u64;
    
    VOTES.with(|votes| {
        for (_, vote) in votes.borrow().iter() {
            if vote.election_id == election_id {
                vote_counts[vote.option_index as usize] += 1;
                total_votes += 1;
            }
        }
    });
    
    Some(ElectionResult {
        election_id,
        title: election.title,
        options: election.options,
        vote_counts,
        total_votes,
    })
}


#[ic_cdk::update]
fn start_election(election_id: String) -> bool {
    ELECTIONS.with(|elections| {
        let mut elections = elections.borrow_mut();
        if let Some(mut election) = elections.get(&StableString::from(election_id.clone())) {
            if election.status == "pending" {
                election.status = "active".to_string();
                elections.insert(StableString::from(election_id), election);
                true
            } else {
                false
            }
        } else {
            false
        }
    })
}

#[ic_cdk::update]
async fn end_election(election_id: String) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    
    if !ADMINS.with(|admins| admins.borrow().contains(&caller)) && caller != ic_cdk::id() {
        return Err("Unauthorized: Only admins can end elections".to_string());
    }
    
    ELECTIONS.with(|elections| {
        let mut elections_map = elections.borrow_mut();
        
        if let Some(election) = elections_map.get(&StableString::from(election_id.clone())) {
            let mut election_clone = election.clone();
            if election_clone.status != "active" {
                return Err(format!("Election is not in active state: {}", election_clone.status));
            }
            
            election_clone.status = "completed".to_string();
            elections_map.insert(StableString::from(election_id), election_clone);
            Ok(())
        } else {
            Err("Election not found".to_string())
        }
    })
}

#[ic_cdk::update]
fn activate_election(election_id: String) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    
    if !ADMINS.with(|admins| admins.borrow().contains(&caller)) {
        return Err("Unauthorized: Only admins can activate elections".to_string());
    }
    
    ELECTIONS.with(|elections| {
        let mut elections_map = elections.borrow_mut();
        
        if let Some(election) = elections_map.get(&StableString::from(election_id.clone())) {
            let mut election_clone = election.clone();
            if election_clone.status != "pending" {
                return Err(format!("Election is not in pending state: {}", election_clone.status));
            }
            
            election_clone.status = "active".to_string();
            elections_map.insert(StableString::from(election_id), election_clone);
            Ok(())
        } else {
            Err("Election not found".to_string())
        }
    })
}

#[ic_cdk::update]
fn delete_election(election_id: String) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    
    if !ADMINS.with(|admins| admins.borrow().contains(&caller)) {
        return Err("Unauthorized: Only admins can delete elections".to_string());
    }
    
    ELECTIONS.with(|elections| {
        let mut elections_map = elections.borrow_mut();
        let election_id_key = StableString::from(election_id.clone());
        
        if elections_map.contains_key(&election_id_key) {
            elections_map.remove(&election_id_key);
            Ok(())
        } else {
            Err("Election not found".to_string())
        }
    })
}

#[ic_cdk::update]
fn add_admin(principal: ic_cdk::export::Principal) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    
    if !ADMINS.with(|admins| admins.borrow().contains(&caller)) {
        return Err("Unauthorized: Only existing admins can add new admins".to_string());
    }
    
    ADMINS.with(|admins| {
        admins.borrow_mut().insert(principal);
    });
    
    Ok(())
}

#[ic_cdk::query]
fn is_admin(principal: ic_cdk::export::Principal) -> bool {
    ADMINS.with(|admins| {
        admins.borrow().contains(&principal)
    })
}


#[init]
fn init() {
    let caller = ic_cdk::caller();
    ADMINS.with(|admins| {
        admins.borrow_mut().insert(caller);
    });
}


candid::export_service!();

#[ic_cdk::query(name = "__get_candid_interface_tmp_hack")]
fn __get_candid_interface_tmp_hack() -> String {
    __export_service()
}
