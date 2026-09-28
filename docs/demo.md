# Hackathon Demo Guide

This guide details the exact steps to demonstrate **MemoraSupport** live to hackathon judges.

## Demo Scenario Walkthrough

### Step 1: Access the Demo Console
1. Open your browser to `http://localhost:3000/demo`.
2. Click **Start Demo & Login**. This automatically seeds and authenticates demo customer `Alex Rivera` with isolated bank `customer_alex`.

### Step 2: Conversation 1 (Stating Issue & Preference)
1. In Step 2 of the demo console (or in the live chat at `/chat`), send:
   > *"My order #4521 was delayed. I prefer email communication."*
2. Observe the AI response acknowledging order #4521 and recording the email preference.
3. Observe the **Live Hindsight Memory Inspector** showing retained memories:
   - Order #4521 delivery delay
   - Email communication preference

### Step 3: Start a NEW Conversation
1. Click **Start NEW Conversation 2** (simulating the customer opening a new session hours later).

### Step 4: Conversation 2 (Testing Memory Recall)
1. In the new conversation, send:
   > *"My refund for that order hasn't arrived."*
2. **Key Acceptance Moment**:
   - The AI agent automatically recalls past memories from Hindsight (`order #4521`, `delivery delay`, `email preference`).
   - The AI responds naturally:
     > *"I remember your previous issue with order #4521... You also prefer email communication. Let me help check your refund status."*
   - Notice that the customer **never had to repeat order number #4521 or email preference**!

### Step 5: Customer Memory Isolation Test
1. Log out and create a new account for `Customer B` (`bob@example.com`).
2. Ask the AI: *"What is my order status?"*
3. Verify that Customer B's agent has no access to Customer A's order #4521 memory.
