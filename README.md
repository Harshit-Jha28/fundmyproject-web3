#  EduFundX (fundmyproject-web3)

> Empowering student innovation through decentralized, milestone-based funding on the Stellar Soroban blockchain.

##  Overview

EduFundX is a decentralized crowdfunding platform built on **Stellar Soroban** that enables students to raise funds for innovative projects in a transparent and trustless manner.

Unlike traditional crowdfunding systems, EduFundX leverages smart contracts to:

* Store project information on-chain
* Protect sponsor contributions through escrow mechanisms
* Release funds only after milestone completion
* Maintain complete transparency and immutability
* Enable global participation through XLM payments

The platform bridges education, innovation, and Web3 technology to create a secure ecosystem for student entrepreneurship.
Live App Link:- https://fundmyproject-web3.vercel.app


Smart Contract Deployed Link:- https://stellar.expert/explorer/testnet/contract/CBLODSR4ZY45EC6WOJPLUKYJIM2WKT5WEEHGQW3ZKOFIE3NAQJOT5SCB
---

##  Features

###  Student Portal

* Create and manage projects
* Set funding goals
* Add project descriptions and categories
* Define milestones
* Track funding progress
* Receive milestone-based payouts

###  Sponsor Portal

* Browse active projects
* Fund projects using XLM
* Monitor milestone completion
* Track sponsorship history
* Verify fund utilization transparently

###  Smart Contract Infrastructure

* Core Project Registry
* Escrow-based fund management
* Milestone verification system
* Immutable project records
* Transparent funding lifecycle

---

## 🏗️ Architecture

```text
Frontend (Next.js + TypeScript)
            │
            ▼
Project Services Layer
            │
            ▼
Stellar SDK Utilities
            │
            ▼
Soroban RPC (Testnet)
            │
            ▼
┌──────────────────────────────┐
│ Core Registry Contract       │
│ Milestone Contract           │
│ Escrow Contract              │
└──────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Category           | Technologies                  |
| ------------------ | ----------------------------- |
| Frontend           | Next.js 15, React, TypeScript |
| Styling            | Tailwind CSS, shadcn/ui       |
| Blockchain         | Stellar Soroban               |
| Smart Contracts    | Rust                          |
| Wallet Integration | Freighter                     |
| Networking         | Horizon API, Soroban RPC      |
| Development Tools  | Cargo, Stellar CLI, npm       |

---

## 📁 Repository Structure

```text
fundmyproject-web3/
│
├── contracts/
│   ├── core-registry/
│   ├── milestone/
│   └── escrow/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   │   ├── projects/
│   │   │   │   ├── components/
│   │   │   │   ├── contract/
│   │   │   │   └── services/
│   │   │   ├── milestones/
│   │   │   └── sponsorship/
│   │   │
│   │   ├── shared/
│   │   │   ├── lib/
│   │   │   ├── types/
│   │   │   ├── hooks/
│   │   │   └── ui/
│   │   │
│   │   └── components/
│   │
│   ├── package.json
│   └── next.config.ts
│
└── README.md
```

---

## ⚙️ Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

NEXT_PUBLIC_CORE_CONTRACT_ID=YOUR_CORE_CONTRACT_ID
NEXT_PUBLIC_MILESTONE_CONTRACT_ID=YOUR_MILESTONE_CONTRACT_ID
NEXT_PUBLIC_ESCROW_CONTRACT_ID=YOUR_ESCROW_CONTRACT_ID
```

---

## 🚀 Running Locally

Install dependencies:

```bash
npm install
```

Start development mode:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run production server:

```bash
npm start
```

---

## 🔨 Smart Contract Commands

Build contracts:

```bash
cargo build --target wasm32-unknown-unknown --release
```

Deploy:

```bash
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/core_registry.wasm --source deployer --network testnet
```

Get project count:

```bash
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- get_project_count
```

Get project details:

```bash
stellar contract invoke --id CONTRACT_ID --source deployer --network testnet -- get_project --id 1
```

---

## 🔄 Funding Workflow

```text
Student
  │
  ▼
Create Project
  │
  ▼
Add Milestones
  │
  ▼
Sponsors Contribute XLM
  │
  ▼
Funds Locked In Escrow
  │
  ▼
Milestones Approved
  │
  ▼
Escrow Releases Funds
  │
  ▼
Student Receives Funding
```

---
Wallet Connected State
<img width="1920" height="1080" alt="Screenshot (321)" src="https://github.com/user-attachments/assets/75a4f330-2fb3-4480-9d96-0547d5c1023f" />

Balance Displayed 
<img width="1920" height="1080" alt="Screenshot (322)" src="https://github.com/user-attachments/assets/9b557b6f-650b-4bbe-a5e9-535f009d4c4f" />

Succesful Testnet Transaction
<img width="1920" height="1080" alt="Screenshot (323)" src="https://github.com/user-attachments/assets/68c191be-3e0e-4601-bb76-4a7d4ff87532" />

Transaction History
<img width="1920" height="1080" alt="Screenshot (326)" src="https://github.com/user-attachments/assets/eb002fd1-d28c-4afb-a6a4-a31ce290c21a" />

Deployed Contract
<img width="1920" height="1080" alt="Screenshot (324)" src="https://github.com/user-attachments/assets/9b910801-c5b0-45e5-8580-0aec98f107a4" />

Test Cases Passed
<img width="1920" height="1080" alt="Screenshot (325)" src="https://github.com/user-attachments/assets/ba80c7c8-54c2-468f-a9e4-b5821edb1606" />

Mobile Responsive View
<img width="720" height="1600" alt="e24493b4-12fd-48a5-a269-ec158ab5847f" src="https://github.com/user-attachments/assets/7144d529-1e9d-44fb-87ae-6dc558fc9dc5" />



## 🛣️ Roadmap

* DAO governance
* University verification
* NFT achievement badges
* AI project recommendations
* Analytics dashboards
* Stablecoin sponsorship support
* Mobile application

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to GitHub
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Harshit Jha**

* GitHub: https://github.com/Harshit-Jha28

Built with ❤️ on Stellar Soroban to empower the next generation of innovators.
