import { NotificationService } from '../../service/NotificationService';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

// Mock prisma client
jest.mock('../../lib/prisma', () => ({
  prisma: {
    vpg_notifications: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
    },
    vpg_users: {
      findMany: jest.fn(),
    },
    vpg_payrolls: {
      count: jest.fn(),
    },
    vpg_audit_logs: {
      create: jest.fn(),
    },
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLegalParamAlert', () => {
    it('creates alert and confirmation, with draft suffix if drafts > 0', async () => {
      // Mock 3 draft payrolls
      (prisma.vpg_payrolls.count as jest.Mock).mockResolvedValue(3);
      
      // Mock 2 target users
      (prisma.vpg_users.findMany as jest.Mock).mockResolvedValue([
        { user_id: 101 },
        { user_id: 102 }
      ]);

      const validFrom = new Date('2025-01-01');
      await NotificationService.createLegalParamAlert(
        'OT_FACTOR',
        '1.5',
        '1.2',
        validFrom,
        99,
        'Admin Name'
      );

      // Verify createMany for target users
      expect(prisma.vpg_notifications.createMany).toHaveBeenCalled();
      const createManyCall = (prisma.vpg_notifications.createMany as jest.Mock).mock.calls[0][0];
      expect(createManyCall.data).toHaveLength(2);
      expect(createManyCall.data[0].notifications_message).toContain('Existen 3 planillas en estado BORRADOR');
      // Verify risk suffix
      expect(createManyCall.data[0].notifications_message).toContain('Art. 139 CT');
      
      // Verify confirmation create
      expect(prisma.vpg_notifications.create).toHaveBeenCalled();
      const createCall = (prisma.vpg_notifications.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.notifications_requires_acknowledgment).toBe(false);
      expect(createCall.data.notifications_user_id).toBe(99);
    });

    it('does not include draft suffix if drafts = 0', async () => {
      (prisma.vpg_payrolls.count as jest.Mock).mockResolvedValue(0);
      (prisma.vpg_users.findMany as jest.Mock).mockResolvedValue([{ user_id: 101 }]);

      await NotificationService.createLegalParamAlert(
        'GLOBAL_MIN_WAGE_RATE',
        '1000',
        '1100',
        new Date(),
        99,
        'Admin'
      );

      const createManyCall = (prisma.vpg_notifications.createMany as jest.Mock).mock.calls[0][0];
      expect(createManyCall.data[0].notifications_message).not.toContain('BORRADOR');
    });

    it('truncates message if it exceeds 500 characters', async () => {
      (prisma.vpg_payrolls.count as jest.Mock).mockResolvedValue(10);
      (prisma.vpg_users.findMany as jest.Mock).mockResolvedValue([{ user_id: 101 }]);

      const longOldValue = 'A'.repeat(600);
      await NotificationService.createLegalParamAlert(
        'OT_FACTOR',
        longOldValue,
        '1.2',
        new Date(),
        99,
        'Admin'
      );

      const createManyCall = (prisma.vpg_notifications.createMany as jest.Mock).mock.calls[0][0];
      expect(createManyCall.data[0].notifications_message.length).toBeLessThanOrEqual(500);
    });
  });

  describe('acknowledgeNotification', () => {
    it('acknowledges and creates audit log on success', async () => {
      (prisma.vpg_notifications.findFirst as jest.Mock).mockResolvedValue({
        notifications_id: 5,
        notifications_requires_acknowledgment: true,
      });

      await NotificationService.acknowledgeNotification(5, 99);

      expect(prisma.vpg_notifications.update).toHaveBeenCalledWith({
        where: { notifications_id: 5 },
        data: {
          notifications_acknowledged_by: 99,
          notifications_acknowledged_at: expect.any(Date),
          notifications_is_read: true,
        },
      });

      expect(prisma.vpg_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          audit_logs_user_id: 99,
          audit_logs_action: 'ACKNOWLEDGE_LEGAL_PARAM_ALERT',
          audit_logs_entity: 'vpg_notifications',
          audit_logs_entity_id: 5,
        }),
      });
    });

    it('throws error if notification is not found or already acknowledged', async () => {
      (prisma.vpg_notifications.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        NotificationService.acknowledgeNotification(5, 99)
      ).rejects.toThrow('Notification not found or already acknowledged');
    });
  });

  describe('getUnacknowledgedLegalParamAlerts', () => {
    it('returns only LEGAL_PARAM_CHANGE requiring acknowledgment', async () => {
      const mockAlerts = [{ id: 1 }, { id: 2 }];
      (prisma.vpg_notifications.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const result = await NotificationService.getUnacknowledgedLegalParamAlerts(101);

      expect(prisma.vpg_notifications.findMany).toHaveBeenCalledWith({
        where: {
          notifications_user_id: 101,
          notifications_type: 'LEGAL_PARAM_CHANGE',
          notifications_requires_acknowledgment: true,
          notifications_acknowledged_by: null,
        },
        orderBy: { notifications_created_at: 'desc' },
      });
      expect(result).toEqual(mockAlerts);
    });
  });
});
