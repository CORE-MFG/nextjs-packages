import { SettingsManager, Settings } from '../settings';

// Type definitions for Next.js API (optional dependency)
interface NextRequest {
  json(): Promise<any>;
}

interface NextResponse {
  json(data: any, options?: { status?: number; headers?: Record<string, string> }): NextResponse;
}

// Mock NextResponse for environments without Next.js
const createNextResponse = () => {
  const mockNextResponse = {
    json: (data: any, options?: { status?: number; headers?: Record<string, string> }) => {
      const response = {
        status: options?.status || 200,
        headers: options?.headers || {},
        data,
      } as any;
      return response as NextResponse;
    }
  };
  
  // Try to import real NextResponse if available
  try {
    const { NextResponse } = require('next/server');
    return NextResponse;
  } catch {
    return mockNextResponse;
  }
};

/**
 * Configuration for the settings API handler
 */
export interface SettingsApiConfig<T extends Settings = Settings> {
  settingsManager: SettingsManager<T>;
  validateUpdate?: (settings: Partial<T>, request: NextRequest) => Promise<boolean> | boolean;
  transformResponse?: (settings: T) => any;
  onSettingsUpdate?: (oldSettings: T, newSettings: T, request: NextRequest) => Promise<void> | void;
}

/**
 * Creates API handlers for settings management
 * Provides GET /ui/config and POST /ui/config endpoints
 */
export function createSettingsApiHandler<T extends Settings = Settings>(
  config: SettingsApiConfig<T>
) {
  const { 
    settingsManager, 
    validateUpdate, 
    transformResponse = (settings) => settings,
    onSettingsUpdate 
  } = config;

  /**
   * GET /ui/config - Fetch current settings
   */
  async function GET(request: NextRequest): Promise<NextResponse> {
    const NextResponse = createNextResponse();
    try {
      const settings = settingsManager.get();
      const response = transformResponse(settings);
      
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (error) {
      console.error('[SettingsAPI] Failed to fetch settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /ui/config - Update settings
   */
  async function POST(request: NextRequest): Promise<NextResponse> {
    const NextResponse = createNextResponse();
    try {
      const body = await request.json();
      
      if (!body || typeof body !== 'object') {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }

      const currentSettings = settingsManager.get();
      
      // Validate the update if validator is provided
      if (validateUpdate) {
        const isValid = await validateUpdate(body, request);
        if (!isValid) {
          return NextResponse.json(
            { error: 'Settings update validation failed' },
            { status: 403 }
          );
        }
      }

      // Update settings
      await settingsManager.set(body);
      const updatedSettings = settingsManager.get();

      // Call update hook if provided
      if (onSettingsUpdate) {
        await onSettingsUpdate(currentSettings, updatedSettings, request);
      }

      const response = transformResponse(updatedSettings);
      
      return NextResponse.json(response);
    } catch (error) {
      console.error('[SettingsAPI] Failed to update settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }
  }

  return { GET, POST };
}

/**
 * Simple settings API handler factory for basic use cases
 */
export function createSimpleSettingsApi<T extends Settings = Settings>(
  settingsManager: SettingsManager<T>
) {
  return createSettingsApiHandler({
    settingsManager,
  });
}

/**
 * Settings API handler with RBAC validation
 * (placeholder for future RBAC implementation)
 */
export function createRBACSettingsApi<T extends Settings = Settings>(
  settingsManager: SettingsManager<T>,
  options: {
    requiredRole?: string;
    requiredPermissions?: string[];
    getUserFromRequest?: (request: NextRequest) => Promise<{ role?: string; permissions?: string[] } | null>;
  } = {}
) {
  const { requiredRole, requiredPermissions, getUserFromRequest } = options;

  return createSettingsApiHandler({
    settingsManager,
    validateUpdate: async (settings, request) => {
      // TODO: Implement RBAC validation when needed
      // For now, return true to allow all updates
      if (!getUserFromRequest) {
        console.warn('[SettingsAPI] RBAC validation requested but no getUserFromRequest function provided');
        return true;
      }

      try {
        const user = await getUserFromRequest(request);
        if (!user) {
          return false;
        }

        if (requiredRole && user.role !== requiredRole) {
          return false;
        }

        if (requiredPermissions && requiredPermissions.length > 0) {
          const userPermissions = user.permissions || [];
          const hasAllPermissions = requiredPermissions.every(
            permission => userPermissions.includes(permission)
          );
          if (!hasAllPermissions) {
            return false;
          }
        }

        return true;
      } catch (error) {
        console.error('[SettingsAPI] RBAC validation error:', error);
        return false;
      }
    },
  });
}

/**
 * Utility to create Next.js API route handlers
 * Usage in app/api/ui/config/route.ts:
 * 
 * import { createNextApiRoute } from 'nextjs-settings';
 * export const { GET, POST } = createNextApiRoute(settingsManager);
 */
export function createNextApiRoute<T extends Settings = Settings>(
  settingsManagerOrConfig: SettingsManager<T> | SettingsApiConfig<T>
) {
  const config = settingsManagerOrConfig instanceof SettingsManager
    ? { settingsManager: settingsManagerOrConfig }
    : settingsManagerOrConfig;

  return createSettingsApiHandler(config);
}
