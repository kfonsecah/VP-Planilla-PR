import { Request, Response } from 'express';
import { LegalParamController } from '../../../controller/LegalParamController';
import { LegalParamService } from '../../../service/LegalParamService';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../../../service/LegalParamService');

describe('LegalParamController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('getParamAtDate', () => {
    it('returns 400 if key is missing', async () => {
      mockRequest.query = {};

      await LegalParamController.getParamAtDate(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, error: 'Missing required query parameter: key' });
    });

    it('returns the param successfully', async () => {
      mockRequest.query = { key: 'OT_FACTOR', date: '2026-01-15' };
      const mockParam = { id: '1', key: 'OT_FACTOR', value: new Decimal('1.5') };
      (LegalParamService.getParamAtDate as jest.Mock).mockResolvedValue(mockParam);

      await LegalParamController.getParamAtDate(mockRequest as Request, mockResponse as Response);

      expect(LegalParamService.getParamAtDate).toHaveBeenCalledWith('OT_FACTOR', new Date('2026-01-15'));
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockParam });
    });
  });

  describe('getAllParams', () => {
    it('returns all params', async () => {
      const mockParams = [{ id: '1' }, { id: '2' }];
      (LegalParamService.getAllParams as jest.Mock).mockResolvedValue(mockParams);

      await LegalParamController.getAllParams(mockRequest as Request, mockResponse as Response);

      expect(LegalParamService.getAllParams).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockParams });
    });
  });

  describe('getParamHistory', () => {
    it('returns 400 if key is missing', async () => {
      mockRequest.params = {};

      await LegalParamController.getParamHistory(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, error: 'Missing required path parameter: key' });
    });

    it('returns history successfully', async () => {
      mockRequest.params = { key: 'OT_FACTOR' };
      const mockHistory = [{ id: '1' }];
      (LegalParamService.getParamHistory as jest.Mock).mockResolvedValue(mockHistory);

      await LegalParamController.getParamHistory(mockRequest as Request, mockResponse as Response);

      expect(LegalParamService.getParamHistory).toHaveBeenCalledWith('OT_FACTOR');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockHistory });
    });
  });

  describe('getParamsByCategory', () => {
    it('returns 400 if category is missing', async () => {
      mockRequest.params = {};

      await LegalParamController.getParamsByCategory(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, error: 'Missing required path parameter: category' });
    });

    it('returns params by category successfully', async () => {
      mockRequest.params = { category: 'OVERTIME' };
      mockRequest.query = { date: '2026-01-15' };
      const mockParams = [{ id: '1' }];
      (LegalParamService.getAllParamsByCategory as jest.Mock).mockResolvedValue(mockParams);

      await LegalParamController.getParamsByCategory(mockRequest as Request, mockResponse as Response);

      expect(LegalParamService.getAllParamsByCategory).toHaveBeenCalledWith('OVERTIME', expect.any(Date));
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockParams });
    });
  });

  describe('upsertParam', () => {
    it('returns 401 if user is not authorized', async () => {
      mockRequest.user = undefined;

      await LegalParamController.upsertParam(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, error: 'Unauthorized' });
    });

    it('returns 400 if required fields are missing', async () => {
      mockRequest.user = { user_id: 'admin' };
      mockRequest.body = { key: 'OT_FACTOR' }; // Missing value, description, etc.

      await LegalParamController.upsertParam(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, error: 'Missing required fields: key, value, description, category, validFrom' });
    });

    it('upserts param successfully', async () => {
      mockRequest.user = { user_id: 'admin' };
      mockRequest.body = {
        key: 'OT_FACTOR',
        value: 1.5,
        description: 'Overtime',
        category: 'OVERTIME',
        validFrom: '2026-01-01',
      };
      const mockParam = { id: 'new-param' };
      (LegalParamService.upsertParam as jest.Mock).mockResolvedValue(mockParam);

      await LegalParamController.upsertParam(mockRequest as Request, mockResponse as Response);

      expect(LegalParamService.upsertParam).toHaveBeenCalledWith(
        {
          key: 'OT_FACTOR',
          value: 1.5,
          description: 'Overtime',
          category: 'OVERTIME',
          validFrom: '2026-01-01',
          isCritical: undefined,
          source_decree: undefined,
        },
        'admin'
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockParam });
    });
  });
});
