# Digital Footprint Analyzer - Data Flow Diagram

The following diagrams illustrate how data flows through the Digital Footprint Analyzer system, from the user's initial request to the final generated report. 

## Level 0: Context Diagram
This diagram shows the system as a single process interacting with external entities.

```mermaid
graph TD
    %% External Entities
    User((User / Frontend))
    Google((Google / SerpAPI))
    Social((Social Platforms))
    Breach((Breach Databases))
    Whois((WHOIS / DNS Services))
    AI((AI Service Provider))
    DB[(Supabase Database)]

    %% Main System
    System[Digital Footprint Analyzer System]

    %% Flow - User Interaction
    User -- "Scan Query (Name, Email, Username)" --> System
    System -- "Comprehensive Scan Report & Insights" --> User
    
    %% Flow - External Integrations
    System -- "Search Queries" --> Google
    Google -- "Search & Mention Results" --> System
    
    System -- "Target Identifiers" --> Social
    Social -- "Profile Links & Public Data" --> System
    
    System -- "Email/Username" --> Breach
    Breach -- "Breached Records Data" --> System
    
    System -- "Domain/Username" --> Whois
    Whois -- "Domain Registration Data" --> System
    
    System -- "Aggregated Scan Results" --> AI
    AI -- "AI-Generated Security Summary" --> System
    
    System -- "Store Scan History & Results" --> DB
    DB -- "Fetch Scan History" --> System
```

---

## Level 1: System Processes Diagram
This diagram breaks down the main system into its core sub-processes, showing how data is validated, collected, analyzed, and stored.

```mermaid
graph TD
    %% Entities
    User[User / Client Frontend]
    Supabase[(Supabase DB / scan_history)]
    GoogleAPI[Google Search / SerpAPI]
    SocialAPI[Social Media Platforms]
    BreachAPI[HaveIBeenPwned / Leak DBs]
    WhoisAPI[WHOIS / DNS Services]
    EmailAPI[Email OSINT Services]
    AI_API[OpenAI / AI Service]

    %% Internal Data Store
    Cache[(In-Memory Cache)]

    %% Processes
    P1((1.0 Request Validation))
    P2((2.0 Data Collection Engine))
    P3((3.0 Deduplication & Risk Analysis))
    P4((4.0 AI Insight Generation))
    P5((5.0 Data Formatting & Storage))

    %% User Input Flow
    User -- "Scan Query Payload" --> P1
    P1 -- "Validation Error (e.g., Invalid Input)" --> User
    
    %% Caching Flow
    P1 -- "Check Cache" --> Cache
    Cache -- "Cached Result Found" --> P1
    P1 -- "Cached Scan Data" --> User
    
    %% Data Collection Flow
    P1 -- "Validated Target Identifiers" --> P2
    
    P2 -- "Target Details" --> GoogleAPI
    GoogleAPI -- "Search Results" --> P2
    
    P2 -- "Usernames / Names" --> SocialAPI
    SocialAPI -- "Profile Data" --> P2
    
    P2 -- "Email / Username" --> BreachAPI
    BreachAPI -- "Breach Records" --> P2
    
    P2 -- "Domain / Username" --> WhoisAPI
    WhoisAPI -- "Domain Info" --> P2
    
    P2 -- "Email" --> EmailAPI
    EmailAPI -- "Email OSINT Data" --> P2
    
    %% Analysis Flow
    P2 -- "Raw Scan Results" --> P3
    
    %% AI Flow
    P3 -- "Risk Score & Deduplicated Data" --> P4
    P4 -- "Results & Score" --> AI_API
    AI_API -- "Generated Security Summary" --> P4
    
    %% Storage & Response Flow
    P4 -- "Full Report (Data + AI Summary)" --> P5
    
    P5 -- "Save new scan record" --> Supabase
    Supabase -- "Confirmation" --> P5
    
    P5 -- "Store in Cache" --> Cache
    
    P5 -- "JSON Response (Scan Data)" --> User
```

## Description of Processes (Level 1)
1. **1.0 Request Validation**: The system receives the scan query from the frontend dashboard. It validates the inputs (name, email, username), normalizes them, and checks the in-memory cache to see if this query was recently performed to avoid redundant external API calls.
2. **2.0 Data Collection Engine**: If the cache misses, the system executes multiple parallel scanners (`socialScanner`, `googleScanner`, `breachService`, etc.). It sends the respective identifiers to external APIs and retrieves raw data.
3. **3.0 Deduplication & Risk Analysis**: The raw results are aggregated. Social profiles are deduplicated based on source confidence priorities. A cumulative risk/privacy score is calculated based on the severity of the findings (e.g., breaches, exposed profiles).
4. **4.0 AI Insight Generation**: The processed results and risk score are passed to the AI Service (via `aiService.js`) to generate a human-readable security summary.
5. **5.0 Data Formatting & Storage**: The final comprehensive report is structured. It is stored persistently in the Supabase database (`scan_history` table), saved to the temporary in-memory cache, and finally returned as a JSON response to the user's dashboard.
