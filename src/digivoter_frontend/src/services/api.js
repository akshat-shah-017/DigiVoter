import { Actor, HttpAgent } from '@dfinity/agent';
import { digivoter_backend } from "../../../declarations/digivoter_backend";
import { BACKEND_CANISTER_ID } from '../../../declarations/index.js';

const API = {
  createActor: (canisterId, options = {}) => {
    console.log("Creating actor with canister ID:", canisterId);
    
    const agent = options.agent || new HttpAgent({ ...options.agentOptions });
    
    if (process.env.NODE_ENV !== "production") {
      console.log("Development environment detected, fetching root key");
      return agent.fetchRootKey().then(() => {
        console.log("Root key fetched successfully");
        return Actor.createActor(idlFactory, {
          agent,
          canisterId,
          ...options.actorOptions
        });
      });
    }
    
    return Actor.createActor(idlFactory, {
      agent,
      canisterId,
      ...options.actorOptions
    });
  },
  
  initializeActor: (identity = null) => {
    console.log("Initializing actor with backend canister ID:", BACKEND_CANISTER_ID);
    
    const options = identity ? { agentOptions: { identity } } : {};
    return API.createActor(BACKEND_CANISTER_ID, options);
  }
};

export default API;
