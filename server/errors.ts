/**
 * NEXUS AI - Standardized Error Handling Architecture
 */

export class NexusError extends Error {
  statusCode: number;
  details?: Record<string, any>;

  constructor(message: string, statusCode = 500, details?: Record<string, any>) {
    super(message);
    this.name = 'NexusError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends NexusError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id '${id}'` : ''} not found`, 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends NexusError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, 400, { fields });
    this.name = 'ValidationError';
  }
}

export class ServiceUnavailableError extends NexusError {
  constructor(serviceName: string, milestoneTarget = 'Milestone 2') {
    super(
      `${serviceName} is not yet connected. Scheduled for ${milestoneTarget}.`,
      503,
      {
        service: serviceName,
        milestone: milestoneTarget,
        state: 'unavailable',
        status: 'pending_integration',
      }
    );
    this.name = 'ServiceUnavailableError';
  }
}
