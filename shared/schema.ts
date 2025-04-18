import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  eventType: text("event_type"),
  date: text("date"),
  time: text("time"),
  location: text("location"),
  organizerId: integer("organizer_id").notNull(),
  supportedLanguages: text("supported_languages").array().notNull().default([]),
  audioConfig: text("audio_config"),
  enableAudioTranslation: boolean("enable_audio_translation").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  sessionId: text("session_id").notNull().unique(),
  language: text("language").default("English"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
});

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  originalText: text("original_text").notNull(),
  translatedText: text("translated_text"),
  language: text("language").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertTranslationSchema = createInsertSchema(translations).omit({
  id: true,
  timestamp: true,
});

export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;
