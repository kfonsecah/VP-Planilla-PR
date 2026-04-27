import { prisma } from '../lib/prisma';
import { AuditLogsService } from './AuditLogsService';

export class EnterpriseService {
  /**
   * Retrieves the current enterprise configuration.
   * Assumes a singleton record exists.
   * @returns Promise<any>
   */
  static async getConfig() {
    return await prisma.vpg_enterprise.findFirst();
  }

  /**
   * Updates the enterprise configuration and records an audit log.
   * @param data - Partial update payload
   * @param userId - ID of the user making the update
   * @returns Promise<any>
   * @throws Error if enterprise config is not found
   */
  static async updateConfig(data: any, userId: number) {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.vpg_enterprise.findFirst();
      if (!current) {
        throw new Error('Enterprise configuration not found');
      }

      const updatePayload = { ...data };

      // Business Logic: If policy changes away from NEAREST_QUARTER, reset acknowledgment
      if (
        data.enterprise_minute_rounding_policy &&
        data.enterprise_minute_rounding_policy !== 'NEAREST_QUARTER'
      ) {
        updatePayload.enterprise_rounding_policy_acknowledged = false;
      }

      const updated = await tx.vpg_enterprise.update({
        where: { enterprise_id: current.enterprise_id },
        data: updatePayload,
      });

      // Audit Log
      let action = 'UPDATE_CONFIG';
      if (data.enterprise_rounding_policy_acknowledged === true) {
        action = 'NEAREST_QUARTER_ACKNOWLEDGED';
      }

      await AuditLogsService.createAuditLog({
        userId,
        action,
        entity: 'enterprise_config',
        entityId: current.enterprise_id,
        details: JSON.stringify(data),
      }, tx);

      return updated;
    });
  }
}
