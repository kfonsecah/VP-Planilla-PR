import { Request, Response } from 'express';
import { NotificationController } from '../../../controller/NotificationController';
import { NotificationService } from '../../../service/NotificationService';

jest.mock('../../../service/NotificationService');

describe('NotificationController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = {
      user: { user_id: 1, user_role: 'admin' },
      params: {},
      query: {},
      body: {},
    };
    res = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('returns unacknowledged legal param alerts when type=LEGAL_PARAM_CHANGE and unacknowledged=true', async () => {
      req.query = { type: 'LEGAL_PARAM_CHANGE', unacknowledged: 'true' };
      const mockAlerts = [{ id: 1, type: 'LEGAL_PARAM_CHANGE' }];
      (NotificationService.getUnacknowledgedLegalParamAlerts as jest.Mock).mockResolvedValue(mockAlerts);

      await NotificationController.getNotifications(req as Request, res as Response);

      expect(NotificationService.getUnacknowledgedLegalParamAlerts).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockAlerts,
        total: 1,
      });
      expect(NotificationService.getNotificationsByUserId).not.toHaveBeenCalled();
    });

    it('returns paginated notifications when no query params are provided', async () => {
      req.query = {};
      const mockData = { data: [{ id: 2 }], total: 1 };
      (NotificationService.getNotificationsByUserId as jest.Mock).mockResolvedValue(mockData);

      await NotificationController.getNotifications(req as Request, res as Response);

      expect(NotificationService.getNotificationsByUserId).toHaveBeenCalledWith(1, 1, 20);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockData.data,
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(NotificationService.getUnacknowledgedLegalParamAlerts).not.toHaveBeenCalled();
    });

    it('falls through to standard pagination when type=LEGAL_PARAM_CHANGE but unacknowledged=false', async () => {
      req.query = { type: 'LEGAL_PARAM_CHANGE', unacknowledged: 'false' };
      const mockData = { data: [], total: 0 };
      (NotificationService.getNotificationsByUserId as jest.Mock).mockResolvedValue(mockData);

      await NotificationController.getNotifications(req as Request, res as Response);

      expect(NotificationService.getNotificationsByUserId).toHaveBeenCalledWith(1, 1, 20);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('returns 400 for invalid type filter', async () => {
      req.query = { type: 'INVALID_TYPE' };

      await NotificationController.getNotifications(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid notification type filter',
      });
      expect(NotificationService.getNotificationsByUserId).not.toHaveBeenCalled();
    });
  });

  describe('acknowledgeNotification', () => {
    it('returns 200 for admin role with valid ID', async () => {
      req.params = { id: '5' };
      req.user = { user_id: 2, user_role: 'admin' };
      (NotificationService.acknowledgeNotification as jest.Mock).mockResolvedValue(undefined);

      await NotificationController.acknowledgeNotification(req as Request, res as Response);

      expect(NotificationService.acknowledgeNotification).toHaveBeenCalledWith(5, 2);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true });
    });

    it('returns 200 for payroll_manager role with valid ID', async () => {
      req.params = { id: '5' };
      req.user = { user_id: 3, user_role: 'payroll_manager' };
      (NotificationService.acknowledgeNotification as jest.Mock).mockResolvedValue(undefined);

      await NotificationController.acknowledgeNotification(req as Request, res as Response);

      expect(NotificationService.acknowledgeNotification).toHaveBeenCalledWith(5, 3);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('returns 403 for employee role without calling service', async () => {
      req.params = { id: '5' };
      req.user = { user_id: 4, user_role: 'employee' };

      await NotificationController.acknowledgeNotification(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Sin permisos para marcar alertas como revisadas',
      });
      expect(NotificationService.acknowledgeNotification).not.toHaveBeenCalled();
    });

    it('returns 400 for non-integer ID', async () => {
      req.params = { id: 'abc' };
      req.user = { user_id: 2, user_role: 'admin' };

      await NotificationController.acknowledgeNotification(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid notification ID',
      });
      expect(NotificationService.acknowledgeNotification).not.toHaveBeenCalled();
    });

    it('returns 404 when service throws error', async () => {
      req.params = { id: '5' };
      req.user = { user_id: 2, user_role: 'admin' };
      (NotificationService.acknowledgeNotification as jest.Mock).mockRejectedValue(
        new Error('Notification not found or already acknowledged')
      );

      await NotificationController.acknowledgeNotification(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Notification not found or already acknowledged',
      });
    });
  });
});
