import { PrismaClient } from "@prisma/client";
import { ClockLogs } from "../model/clockLog";

const prisma = new PrismaClient();

/**
 * Request parameters for filtering clock logs by date range
 */
export interface RequestParams {
    /** Start date for the clock logs query */
    initDate: Date;
    /** End date for the clock logs query */
    endDate: Date;
}

export class ClockLogsService {
    /**
     * Retrieve clock logs within a specified date range
     * @param params - Request parameters containing start and end dates
     * @returns Promise<ClockLogs[]> - Array of clock logs within the specified date range
     * @throws Error if database query fails
     */
    async getClockLogs(params : RequestParams): Promise<ClockLogs[]> {
        const logs = await prisma.vpg_clock_logs.findMany({
            where: {
                clock_logs_timestamp: {
                    gte: params.initDate,
                    lte: params.endDate
                }
            }
        });

        return logs.map(log => ({
            id: log.clock_logs_id,
            employee_id: log.clock_logs_employee_id,
            timestamp: log.clock_logs_timestamp,
            log_type: log.clock_logs_log_type,
            remarks: log.clock_logs_remarks ?? undefined,
            version: log.clock_logs_version
        }));

    }
}