# 🩺 Decentralized Medical Record System

Welcome to a revolutionary way to manage medical records on the Stacks blockchain! This project empowers patients to securely store, control, and share their medical records while ensuring privacy, immutability, and accessibility using Clarity smart contracts.

## ✨ Features

🔒 **Patient-Controlled Records**: Patients own and manage their medical data.  
📝 **Secure Data Storage**: Store encrypted medical records with immutable timestamps.  
🔐 **Granular Access Control**: Grant or revoke access to specific healthcare providers.  
✅ **Verification of Records**: Verify authenticity of medical records.  
🩺 **Provider Updates**: Authorized providers can append updates to patient records.  
💎 **Tokenized Incentives**: Patients and providers earn NFT-based badges for participation.  
🔍 **Audit Trail**: Track all access and updates to records for transparency.  
🚫 **Duplicate Prevention**: Ensure no duplicate records or unauthorized access.

## 🛠 How It Works

**For Patients**  
- Register as a patient with a unique ID and public key.  
- Upload encrypted medical records (hash of the data) with metadata (e.g., title, date).  
- Grant or revoke access to specific providers using their principal addresses.  
- Earn NFT badges for maintaining up-to-date records or sharing data for research.  

**For Healthcare Providers**  
- Register as a provider with a verified principal address.  
- Request access to a patient’s records.  
- Append updates (e.g., diagnoses, prescriptions) to authorized records.  
- Earn NFT badges for contributing verified updates.  

**For Verifiers (e.g., Insurers, Researchers)**  
- Verify the authenticity of a patient’s record using its hash and timestamp.  
- Check the audit trail to ensure data integrity and access history.  

## 📜 Smart Contracts

The system comprises 8 Clarity smart contracts:

1. **PatientRegistry**: Registers patients and stores their public keys.  
2. **ProviderRegistry**: Registers verified healthcare providers.  
3. **RecordStorage**: Stores encrypted medical record hashes and metadata (title, timestamp).  
4. **AccessControl**: Manages permissions for providers to access or update records.  
5. **RecordUpdate**: Handles appending updates to existing records by authorized providers.  
6. **Verification**: Allows third parties to verify record authenticity and ownership.  
7. **NFTBadge**: Issues tokenized NFT badges as rewards for patients and providers.  
8. **AuditTrail**: Tracks all access and update actions for transparency.

## 🚀 Getting Started

### Prerequisites
- Stacks blockchain environment (testnet or mainnet).  
- Clarity development tools (e.g., Clarinet).  
- A wallet compatible with Stacks (e.g., Hiro Wallet).  

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/your-repo/decentralized-medical-records.git
   ```
2. Install dependencies and set up Clarinet:
   ```
   npm install
   clarinet integrate
   ```
3. Deploy the smart contracts to the Stacks testnet:
   ```
   clarinet deploy
   ```

### Usage
- **Patients**: Call `register-patient` in the `PatientRegistry` contract with your principal and public key. Upload records using `store-record` in the `RecordStorage` contract.  
- **Providers**: Register via `register-provider` in the `ProviderRegistry` contract. Request access using `request-access` in the `AccessControl` contract.  
- **Verifiers**: Use `verify-record` in the `Verification` contract to check record authenticity.  
- **Rewards**: Earn NFTs via the `NFTBadge` contract for contributions (e.g., updating records, sharing data).  

## 🛠 Example Workflow
1. A patient registers and uploads an encrypted record hash with metadata (e.g., "Blood Test 2025-09-14").  
2. A provider requests access, and the patient grants it via the `AccessControl` contract.  
3. The provider appends a diagnosis to the record using the `RecordUpdate` contract.  
4. An insurer verifies the record’s authenticity using the `Verification` contract.  
5. The patient and provider receive NFT badges for their contributions.  
6. All actions are logged in the `AuditTrail` contract for transparency.

## 📚 Smart Contract Details

### 1. PatientRegistry
- **Function**: `register-patient (principal, public-key)`  
  Registers a patient with their principal and public key.  
- **Function**: `get-patient-details (principal)`  
  Retrieves patient registration details.

### 2. ProviderRegistry
- **Function**: `register-provider (principal, credentials)`  
  Registers a verified provider with credentials (e.g., medical license hash).  
- **Function**: `verify-provider (principal)`  
  Confirms provider registration.

### 3. RecordStorage
- **Function**: `store-record (record-hash, title, timestamp)`  
  Stores an encrypted record hash with metadata.  
- **Function**: `get-record-details (record-id)`  
  Retrieves record metadata.

### 4. AccessControl
- **Function**: `grant-access (provider-principal, record-id)`  
  Grants a provider access to a specific record.  
- **Function**: `revoke-access (provider-principal, record-id)`  
  Revokes access.

### 5. RecordUpdate
- **Function**: `append-update (record-id, update-hash, description)`  
  Appends an update to a record by an authorized provider.  
- **Function**: `get-update-history (record-id)`  
  Retrieves update history.

### 6. Verification
- **Function**: `verify-record (record-id, record-hash)`  
  Verifies the authenticity of a record.  
- **Function**: `check-ownership (record-id, principal)`  
  Confirms the record owner.

### 7. NFTBadge
- **Function**: `mint-badge (recipient, badge-type)`  
  Mints an NFT badge for contributions (e.g., "Active Patient," "Trusted Provider").  
- **Function**: `get-badge-details (badge-id)`  
  Retrieves badge metadata.

### 8. AuditTrail
- **Function**: `log-action (record-id, action-type, principal)`  
  Logs actions like access or updates.  
- **Function**: `get-audit-log (record-id)`  
  Retrieves the audit trail for a record.

## 🎁 Tokenized Incentives
- Patients earn NFT badges for maintaining records or sharing anonymized data for research.  
- Providers earn badges for verified updates or participation in the network.  
- Badges are non-transferable NFTs stored in the `NFTBadge` contract, serving as proof of contribution.

## 🔐 Security Considerations
- Records are stored as encrypted hashes to ensure privacy.  
- Access control ensures only authorized providers can view or update records.  
- Immutable audit trails prevent tampering and ensure transparency.  
- NFT badges are soulbound to prevent speculative trading.

## 🌟 Why This Matters
This project solves real-world problems by:
- Giving patients control over their medical data.  
- Reducing inefficiencies in sharing records across providers.  
- Enhancing trust through blockchain immutability and transparency.  
- Incentivizing participation with tokenized rewards.

