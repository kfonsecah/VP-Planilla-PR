// DONE Code documentation
import { PrismaClient } from "@prisma/client";
import { Position } from "../model/position";

const prisma = new PrismaClient();

export class PositionService {
  /**
   * Get a position by its ID.
   * @param positionId The ID of the position.
   * @returns The position record or null if not found.
   */
  static async getPositionById(positionId: number): Promise<Position | null> {
    const prismaPosition = await prisma.vpg_positions.findUnique({
      where: { position_id: positionId },
    });

    if (!prismaPosition) {
      return null;
    }

    const position: Position = {
      id: prismaPosition.position_id,
      name: prismaPosition.position_name,
      description: prismaPosition.position_description,
      base_salary: prismaPosition.position_base_salary
        .toDecimalPlaces(2)
        .toNumber(),
      version: prismaPosition.position_version,
    };

    return position;
  }

  /**
   * Get all positions in the database.
   * @returns All positions in the database
   */

  static async getAllPositions(): Promise<Position[]> {
    const prismaPositions = await prisma.vpg_positions.findMany();

    return prismaPositions.map((prismaPosition) => ({
      id: prismaPosition.position_id,
      name: prismaPosition.position_name,
      description: prismaPosition.position_description,
      base_salary: prismaPosition.position_base_salary
        .toDecimalPlaces(2)
        .toNumber(),
      version: prismaPosition.position_version,
    }));
  }
  /**
   * Create a new position in the database.
   * @param position The position data to create (excluding id and version).
   * @returns The created position with its assigned ID and version.
   */

  static async createPosition(
    position: Omit<Position, "id" | "version">
  ): Promise<Position> {
    const prismaPosition = await prisma.vpg_positions.create({
      data: {
        position_name: position.name,
        position_description: position.description,
        position_base_salary: position.base_salary,
        position_version: 1,
      },
    });

    return {
      id: prismaPosition.position_id,
      name: prismaPosition.position_name,
      description: prismaPosition.position_description,
      base_salary: prismaPosition.position_base_salary
        .toDecimalPlaces(2)
        .toNumber(),
      version: prismaPosition.position_version,
    };
  }
  /**
   * Update an existing position in the database.
   * @param position The position data to update (including id and version).
   * @returns
   */
  static async updatePosition(position: Position): Promise<Position | null> {
    const prismaPosition = await prisma.vpg_positions.updateMany({
      where: {
        position_id: position.id,
        position_version: position.version,
      },
      data: {
        position_name: position.name,
        position_description: position.description,
        position_base_salary: position.base_salary,
        position_version: position.version + 1,
      },
    });

    if (prismaPosition.count === 0) {
      return null; // No rows were updated, possibly due to version mismatch
    }

    const updatedPosition = await this.getPositionById(position.id);
    return updatedPosition;
  }

  /**
   * Delete a position by its ID.
   * @param positionId The ID of the position to delete.
   * @returns True if the position was deleted, false otherwise.
   */
  static async deletePosition(positionId: number): Promise<boolean> {
    const prismaPosition = await prisma.vpg_positions.deleteMany({
      where: { position_id: positionId },
    });

    return prismaPosition.count > 0;
  }
}
