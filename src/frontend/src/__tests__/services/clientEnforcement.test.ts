import { AuditLogsService } from '../../services/auditLogsService';
import { BranchService } from '../../services/branchService';
import { PayrollEmployeesService } from '../../services/payrollEmployeesService';
import { http } from '../../services/http';

// Mock the http service
jest.mock('../../services/http', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the externalHttp service
jest.mock('../../services/externalHttp', () => ({
  externalHttp: {
    get: jest.fn(),
  },
}));

describe('HTTP Client Layer Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuditLogsService', () => {
    it('should use http.get for getAuditLogs', async () => {
      (http.get as jest.Mock).mockResolvedValue({ data: [] });
      await AuditLogsService.getAuditLogs({ userId: 1 });
      expect(http.get).toHaveBeenCalledWith(expect.stringContaining('audit-logs?userId=1'));
    });

    it('should use http.get for getAuditLogById', async () => {
      (http.get as jest.Mock).mockResolvedValue({ id: 1 });
      await AuditLogsService.getAuditLogById(1);
      expect(http.get).toHaveBeenCalledWith('audit-logs/1');
    });
  });

  describe('BranchService', () => {
    it('should use http.get for getAllBranches', async () => {
      (http.get as jest.Mock).mockResolvedValue([]);
      await BranchService.getAllBranches();
      expect(http.get).toHaveBeenCalledWith('branches');
    });

    it('should use http.post for createBranch', async () => {
      const branchData = { name: 'Test Branch', address: 'Test Address' };
      (http.post as jest.Mock).mockResolvedValue({ id: 1, ...branchData });
      await BranchService.createBranch(branchData as any);
      expect(http.post).toHaveBeenCalledWith('branches', branchData);
    });

    it('should use http.put for updateBranch', async () => {
      const branchData = { name: 'Updated Branch' };
      (http.put as jest.Mock).mockResolvedValue({ id: 1, ...branchData });
      await BranchService.updateBranch(1, branchData);
      expect(http.put).toHaveBeenCalledWith('branches/1', branchData);
    });

    it('should use http.delete for deleteBranch', async () => {
      (http.delete as jest.Mock).mockResolvedValue({});
      await BranchService.deleteBranch(1);
      expect(http.delete).toHaveBeenCalledWith('branches/1');
    });
  });

  describe('PayrollEmployeesService', () => {
    it('should use http.get for getPayrollEmployees', async () => {
      (http.get as jest.Mock).mockResolvedValue([]);
      await PayrollEmployeesService.getPayrollEmployees(123);
      expect(http.get).toHaveBeenCalledWith('payroll/123/employees');
    });
  });
});
