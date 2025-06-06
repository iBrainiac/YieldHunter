import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  balance: text("balance"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  balance: true,
});

// DeFi protocols table
export const protocols = pgTable("protocols", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo").notNull(),
  website: text("website"),
  description: text("description"),
  riskLevel: text("risk_level").notNull(),
});

export const insertProtocolSchema = createInsertSchema(protocols).pick({
  name: true,
  logo: true,
  website: true,
  description: true,
  riskLevel: true,
});

// Blockchain networks table
export const networks = pgTable("networks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  logo: text("logo"),
  isActive: boolean("is_active").default(true),
});

export const insertNetworkSchema = createInsertSchema(networks).pick({
  name: true,
  shortName: true,
  logo: true,
  isActive: true,
});

// Yield opportunities table
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  protocolId: integer("protocol_id").notNull(),
  networkId: integer("network_id").notNull(),
  asset: text("asset").notNull(),
  apy: real("apy").notNull(),
  tvl: real("tvl"),
  riskLevel: text("risk_level").notNull(),
  details: text("details"),
  url: text("url"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertOpportunitySchema = createInsertSchema(opportunities).pick({
  protocolId: true,
  networkId: true,
  asset: true,
  apy: true,
  tvl: true,
  riskLevel: true,
  details: true,
  url: true,
});

// Social posts table
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"),
  timestamp: timestamp("timestamp").defaultNow(),
  scheduledAt: timestamp("scheduled_at"),
  opportunityId: integer("opportunity_id"),
});

export const insertSocialPostSchema = createInsertSchema(socialPosts).pick({
  platform: true,
  content: true,
  status: true,
  scheduledAt: true,
  opportunityId: true,
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
  userId: integer("user_id"),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  details: true,
  userId: true,
});

// Agent configurations table
export const agentConfigurations = pgTable("agent_configurations", {
  id: serial("id").primaryKey(),
  scanFrequency: text("scan_frequency").notNull().default("hourly"),
  riskTolerance: text("risk_tolerance").notNull().default("low"),
  networks: jsonb("networks").notNull(),
  postingMode: text("posting_mode").notNull().default("approval"),
  parallelScanning: boolean("parallel_scanning").notNull().default(false),
  maxAgents: integer("max_agents").notNull().default(3),
  userId: integer("user_id"),
});

export const insertAgentConfigurationSchema = createInsertSchema(agentConfigurations).pick({
  scanFrequency: true,
  riskTolerance: true,
  networks: true,
  postingMode: true,
  parallelScanning: true,
  maxAgents: true,
  userId: true,
});

// Agent instances table for multi-agent architecture
export const agentInstances = pgTable("agent_instances", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("idle"), // idle, scanning, paused, error
  assignedProtocol: integer("assigned_protocol"),
  assignedNetwork: integer("assigned_network"),
  lastScanTime: timestamp("last_scan_time"),
  currentTask: text("current_task"),
  performance: jsonb("performance"), // metrics about this agent's performance
  createdAt: timestamp("created_at").defaultNow(),
  configurationId: integer("configuration_id").notNull(),
});

export const insertAgentInstanceSchema = createInsertSchema(agentInstances).pick({
  name: true,
  status: true,
  assignedProtocol: true,
  assignedNetwork: true,
  currentTask: true,
  performance: true,
  configurationId: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;

export type Network = typeof networks.$inferSelect;
export type InsertNetwork = z.infer<typeof insertNetworkSchema>;

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type AgentConfiguration = typeof agentConfigurations.$inferSelect;
export type InsertAgentConfiguration = z.infer<typeof insertAgentConfigurationSchema>;

export type AgentInstance = typeof agentInstances.$inferSelect;
export type InsertAgentInstance = z.infer<typeof insertAgentInstanceSchema>;

// Automated yield farming strategies table
export const yieldStrategies = pgTable("yield_strategies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, paused, completed
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  lastExecutedAt: timestamp("last_executed_at"),
  totalExecutions: integer("total_executions").default(0),
  conditions: jsonb("conditions").notNull(), // JSON with strategy conditions
  actions: jsonb("actions").notNull(), // JSON with actions to execute when conditions are met
  executionResults: jsonb("execution_results"), // History of execution results
  maxGasFee: real("max_gas_fee"), // Maximum gas fee willing to pay for transactions
  triggerType: text("trigger_type").notNull(), // time-based, price-based, apy-based
  nextScheduledExecution: timestamp("next_scheduled_execution"),
  targetProtocols: jsonb("target_protocols").notNull(), // Array of protocol IDs
  targetNetworks: jsonb("target_networks").notNull(), // Array of network IDs
  totalInvested: real("total_invested").default(0),
  totalReturn: real("total_return").default(0),
  settings: jsonb("settings"), // Additional strategy settings
});

export const insertYieldStrategySchema = createInsertSchema(yieldStrategies).pick({
  name: true,
  description: true,
  status: true,
  userId: true,
  conditions: true,
  actions: true, 
  maxGasFee: true,
  triggerType: true,
  nextScheduledExecution: true,
  targetProtocols: true,
  targetNetworks: true,
  settings: true,
});

// Strategy executions table to track individual operations
export const strategyExecutions = pgTable("strategy_executions", {
  id: serial("id").primaryKey(), 
  strategyId: integer("strategy_id").notNull(),
  status: text("status").notNull(), // success, failed, pending
  executedAt: timestamp("executed_at").defaultNow(),
  transactionHash: text("transaction_hash"),
  gasUsed: real("gas_used"),
  gasFee: real("gas_fee"),
  opportunityId: integer("opportunity_id"),
  details: jsonb("details"), // Details of the execution
  errorMessage: text("error_message"),
});

export const insertStrategyExecutionSchema = createInsertSchema(strategyExecutions).pick({
  strategyId: true,
  status: true,
  transactionHash: true,
  gasUsed: true,
  gasFee: true,
  opportunityId: true,
  details: true,
  errorMessage: true,
});

export type YieldStrategy = typeof yieldStrategies.$inferSelect;
export type InsertYieldStrategy = z.infer<typeof insertYieldStrategySchema>;

export type StrategyExecution = typeof strategyExecutions.$inferSelect;
export type InsertStrategyExecution = z.infer<typeof insertStrategyExecutionSchema>;

// Table for storing Telegram bot users
export const telegramUsers = pgTable("telegram_users", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  telegramId: integer("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  walletAddress: text("wallet_address"),
  isAuthenticated: boolean("is_authenticated").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastInteraction: timestamp("last_interaction").defaultNow().notNull(),
  preferences: jsonb("preferences").notNull().default({}),
});

export const insertTelegramUserSchema = createInsertSchema(telegramUsers).pick({
  userId: true,
  telegramId: true,
  username: true,
  firstName: true,
  lastName: true,
  walletAddress: true,
  isAuthenticated: true,
  preferences: true,
});

export type TelegramUser = typeof telegramUsers.$inferSelect;
export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
