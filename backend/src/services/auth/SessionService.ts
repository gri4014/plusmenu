import { v4 as uuidv4 } from 'uuid';
import { Session, SessionCreateParams, SessionValidationResult } from '../../types/session';
import { jwtService } from './JWTService';

/**
 * Service for managing authentication sessions
 */
export class SessionService {
  private sessions: Map<string, Session>;
  private readonly CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour

  constructor() {
    this.sessions = new Map();
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredSessions(), this.CLEANUP_INTERVAL);
  }

  /**
   * Create a new session for a user
   * @param params Session creation parameters
   * @returns The created session
   */
  public createSession(params: SessionCreateParams): Session {
    const now = new Date();
    const token = jwtService.generateToken({
      id: params.userId,
      role: params.role,
      entity: params.entity
    });

    const session: Session = {
      id: uuidv4(),
      userId: params.userId,
      role: params.role,
      entity: params.entity,
      createdAt: now,
      lastActivity: now,
      token
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get a session by its ID
   * @param sessionId The session ID
   * @returns The session if found, null otherwise
   */
  public getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update the last activity timestamp of a session
   * @param sessionId The session ID
   * @returns true if session was updated, false if session not found
   */
  public updateSessionActivity(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.lastActivity = new Date();
    this.sessions.set(sessionId, session);
    return true;
  }

  /**
   * Validate a session and its associated token
   * @param sessionId The session ID
   * @returns The validation result
   */
  public validateSession(sessionId: string): SessionValidationResult {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return {
        valid: false,
        error: 'Session not found'
      };
    }

    // Validate the JWT token
    const tokenValidation = jwtService.validateToken(session.token);
    if (!tokenValidation.valid) {
      return {
        valid: false,
        error: 'Invalid session token'
      };
    }

    return {
      valid: true,
      session
    };
  }

  /**
   * Remove a session
   * @param sessionId The session ID
   * @returns true if session was removed, false if session not found
   */
  public removeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions for a user
   * @param userId The user ID
   * @returns Array of active sessions
   */
  public getUserSessions(userId: string): Session[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId);
  }

  /**
   * Remove all sessions for a user
   * @param userId The user ID
   * @returns Number of sessions removed
   */
  public removeUserSessions(userId: string): number {
    let count = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  /**
   * Clean up expired sessions
   * @private
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.sessions.entries()) {
      const inactiveTime = now.getTime() - session.lastActivity.getTime();
      if (inactiveTime > maxInactivity) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();
