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
