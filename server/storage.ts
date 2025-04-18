import { 
  users, 
  type User, 
  type InsertUser,
  events,
  type Event,
  type InsertEvent,
  participants,
  type Participant,
  type InsertParticipant,
  translations,
  type Translation,
  type InsertTranslation 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event methods
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  getEventsByOrganizer(organizerId: number): Promise<Event[]>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Participant methods
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipant(id: number): Promise<Participant | undefined>;
  getParticipantBySessionId(sessionId: string): Promise<Participant | undefined>;
  getParticipantsByEvent(eventId: number): Promise<Participant[]>;
  updateParticipant(id: number, participant: Partial<InsertParticipant>): Promise<Participant | undefined>;
  
  // Translation methods
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getTranslationsByEvent(eventId: number): Promise<Translation[]>;
  getRecentTranslations(eventId: number, limit: number): Promise<Translation[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private participants: Map<number, Participant>;
  private translations: Map<number, Translation>;
  
  private userCurrentId: number;
  private eventCurrentId: number;
  private participantCurrentId: number;
  private translationCurrentId: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.participants = new Map();
    this.translations = new Map();
    
    this.userCurrentId = 1;
    this.eventCurrentId = 1;
    this.participantCurrentId = 1;
    this.translationCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Event methods
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventCurrentId++;
    const createdAt = new Date();
    const event: Event = { ...insertEvent, id, createdAt };
    this.events.set(id, event);
    return event;
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async getEventsByOrganizer(organizerId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.organizerId === organizerId
    );
  }
  
  async updateEvent(id: number, eventUpdate: Partial<InsertEvent>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...eventUpdate };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }
  
  // Participant methods
  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = this.participantCurrentId++;
    const createdAt = new Date();
    const participant: Participant = { ...insertParticipant, id, createdAt };
    this.participants.set(id, participant);
    return participant;
  }
  
  async getParticipant(id: number): Promise<Participant | undefined> {
    return this.participants.get(id);
  }
  
  async getParticipantBySessionId(sessionId: string): Promise<Participant | undefined> {
    return Array.from(this.participants.values()).find(
      (participant) => participant.sessionId === sessionId
    );
  }
  
  async getParticipantsByEvent(eventId: number): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(
      (participant) => participant.eventId === eventId
    );
  }
  
  async updateParticipant(id: number, participantUpdate: Partial<InsertParticipant>): Promise<Participant | undefined> {
    const existingParticipant = this.participants.get(id);
    if (!existingParticipant) return undefined;
    
    const updatedParticipant = { ...existingParticipant, ...participantUpdate };
    this.participants.set(id, updatedParticipant);
    return updatedParticipant;
  }
  
  // Translation methods
  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const id = this.translationCurrentId++;
    const timestamp = new Date();
    const translation: Translation = { ...insertTranslation, id, timestamp };
    this.translations.set(id, translation);
    return translation;
  }
  
  async getTranslationsByEvent(eventId: number): Promise<Translation[]> {
    return Array.from(this.translations.values())
      .filter((translation) => translation.eventId === eventId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async getRecentTranslations(eventId: number, limit: number): Promise<Translation[]> {
    return Array.from(this.translations.values())
      .filter((translation) => translation.eventId === eventId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
