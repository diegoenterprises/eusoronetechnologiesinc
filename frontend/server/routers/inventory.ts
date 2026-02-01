/**
 * INVENTORY ROUTER
 * tRPC procedures for terminal inventory and tank management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { terminals } from "../../drizzle/schema";

const productTypeSchema = z.enum([
  "unleaded", "premium", "diesel", "jet_fuel", "heating_oil", "propane", "ethanol", "biodiesel"
]);

export const inventoryRouter = router({
  /**
   * Get terminal inventory overview
   */
  getOverview: protectedProcedure
    .input(z.object({
      terminalId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        terminalId: input.terminalId,
        terminalName: "Houston Distribution Terminal",
        lastUpdated: new Date().toISOString(),
        totalCapacity: 2500000,
        totalInventory: 1875000,
        utilizationRate: 0.75,
        tanks: [
          {
            id: "tank_001",
            name: "Tank A1",
            product: "unleaded",
            capacity: 500000,
            currentLevel: 425000,
            utilization: 0.85,
            status: "operational",
            lastFilled: "2025-01-22T08:00:00Z",
          },
          {
            id: "tank_002",
            name: "Tank A2",
            product: "unleaded",
            capacity: 500000,
            currentLevel: 380000,
            utilization: 0.76,
            status: "operational",
            lastFilled: "2025-01-21T14:00:00Z",
          },
          {
            id: "tank_003",
            name: "Tank B1",
            product: "diesel",
            capacity: 750000,
            currentLevel: 620000,
            utilization: 0.83,
            status: "operational",
            lastFilled: "2025-01-23T06:00:00Z",
          },
          {
            id: "tank_004",
            name: "Tank C1",
            product: "premium",
            capacity: 250000,
            currentLevel: 175000,
            utilization: 0.70,
            status: "maintenance",
            maintenanceNote: "Scheduled inspection",
            maintenanceEnd: "2025-01-24T12:00:00Z",
          },
        ],
        alerts: [
          { type: "low_level", tankId: "tank_004", message: "Tank C1 below 75% threshold", severity: "warning" },
        ],
      };
    }),

  /**
   * Get tank details
   */
  getTankDetails: protectedProcedure
    .input(z.object({
      tankId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        id: input.tankId,
        name: "Tank A1",
        terminalId: "term_001",
        terminalName: "Houston Distribution Terminal",
        product: "unleaded",
        grade: "87 Octane Regular",
        capacity: 500000,
        currentLevel: 425000,
        utilization: 0.85,
        status: "operational",
        specifications: {
          material: "Steel",
          yearBuilt: 2015,
          lastInspection: "2024-11-15",
          nextInspection: "2025-05-15",
          certifications: ["API 653", "EPA Compliant"],
        },
        gauging: {
          type: "automatic",
          lastReading: new Date().toISOString(),
          temperature: 68.5,
          waterLevel: 0.02,
          apiGravity: 58.2,
        },
        recentActivity: [
          { type: "receipt", quantity: 50000, timestamp: "2025-01-22T08:00:00Z", source: "Pipeline A" },
          { type: "delivery", quantity: -8500, timestamp: "2025-01-22T10:30:00Z", destination: "LOAD-45850" },
          { type: "delivery", quantity: -8200, timestamp: "2025-01-22T14:15:00Z", destination: "LOAD-45855" },
          { type: "delivery", quantity: -8800, timestamp: "2025-01-23T07:00:00Z", destination: "LOAD-45860" },
        ],
      };
    }),

  /**
   * Get inventory by product
   */
  getByProduct: protectedProcedure
    .input(z.object({
      terminalId: z.string().optional(),
      product: productTypeSchema.optional(),
    }))
    .query(async ({ input }) => {
      return {
        products: [
          {
            product: "unleaded",
            totalCapacity: 1000000,
            totalInventory: 805000,
            utilization: 0.805,
            tanks: 2,
            avgPrice: 2.45,
            demandTrend: "stable",
          },
          {
            product: "diesel",
            totalCapacity: 750000,
            totalInventory: 620000,
            utilization: 0.827,
            tanks: 1,
            avgPrice: 2.85,
            demandTrend: "up",
          },
          {
            product: "premium",
            totalCapacity: 250000,
            totalInventory: 175000,
            utilization: 0.70,
            tanks: 1,
            avgPrice: 2.95,
            demandTrend: "stable",
          },
        ],
      };
    }),

  /**
   * Record inventory transaction
   */
  recordTransaction: protectedProcedure
    .input(z.object({
      tankId: z.string(),
      type: z.enum(["receipt", "delivery", "transfer", "adjustment"]),
      quantity: z.number(),
      reference: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `txn_${Date.now()}`,
        tankId: input.tankId,
        type: input.type,
        quantity: input.quantity,
        recordedBy: ctx.user?.id,
        recordedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get inventory history
   */
  getHistory: protectedProcedure
    .input(z.object({
      tankId: z.string().optional(),
      terminalId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const transactions = [
        { id: "txn_001", tankId: "tank_001", type: "receipt", quantity: 50000, timestamp: "2025-01-22T08:00:00Z", source: "Pipeline A", recordedBy: "System" },
        { id: "txn_002", tankId: "tank_001", type: "delivery", quantity: -8500, timestamp: "2025-01-22T10:30:00Z", reference: "LOAD-45850", recordedBy: "Mike Johnson" },
        { id: "txn_003", tankId: "tank_003", type: "receipt", quantity: 75000, timestamp: "2025-01-23T06:00:00Z", source: "Pipeline B", recordedBy: "System" },
        { id: "txn_004", tankId: "tank_001", type: "delivery", quantity: -8200, timestamp: "2025-01-22T14:15:00Z", reference: "LOAD-45855", recordedBy: "Sarah Williams" },
      ];

      return {
        transactions: transactions.slice(0, input.limit),
        total: transactions.length,
      };
    }),

  /**
   * Get low inventory alerts
   */
  getAlerts: protectedProcedure
    .input(z.object({
      terminalId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "alert_001",
          type: "low_level",
          severity: "warning",
          tankId: "tank_004",
          tankName: "Tank C1",
          product: "premium",
          currentLevel: 175000,
          threshold: 187500,
          message: "Tank C1 inventory below 75% threshold",
          createdAt: "2025-01-23T09:00:00Z",
        },
        {
          id: "alert_002",
          type: "high_demand",
          severity: "info",
          product: "diesel",
          message: "Diesel demand 15% higher than forecast",
          createdAt: "2025-01-23T08:00:00Z",
        },
      ];
    }),

  /**
   * Get forecasted demand
   */
  getForecast: protectedProcedure
    .input(z.object({
      terminalId: z.string(),
      product: productTypeSchema.optional(),
      days: z.number().default(7),
    }))
    .query(async ({ input }) => {
      return {
        terminalId: input.terminalId,
        forecastPeriod: `${input.days} days`,
        products: [
          {
            product: "unleaded",
            currentInventory: 805000,
            forecastedDemand: 280000,
            daysOfSupply: 20,
            recommendedOrder: 0,
            confidence: 0.92,
          },
          {
            product: "diesel",
            currentInventory: 620000,
            forecastedDemand: 350000,
            daysOfSupply: 12,
            recommendedOrder: 100000,
            confidence: 0.88,
          },
          {
            product: "premium",
            currentInventory: 175000,
            forecastedDemand: 85000,
            daysOfSupply: 14,
            recommendedOrder: 50000,
            confidence: 0.90,
          },
        ],
      };
    }),

  /**
   * Schedule delivery/receipt
   */
  scheduleMovement: protectedProcedure
    .input(z.object({
      terminalId: z.string(),
      tankId: z.string(),
      type: z.enum(["receipt", "delivery"]),
      quantity: z.number().positive(),
      scheduledDate: z.string(),
      source: z.string().optional(),
      destination: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `schedule_${Date.now()}`,
        ...input,
        status: "scheduled",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get EIA report data
   */
  getEIAReport: protectedProcedure
    .input(z.object({
      terminalId: z.string(),
      reportPeriod: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        terminalId: input.terminalId,
        reportPeriod: input.reportPeriod,
        status: "pending_submission",
        dueDate: "2025-01-31",
        data: {
          beginningInventory: 1750000,
          receipts: 450000,
          deliveries: 325000,
          endingInventory: 1875000,
          byProduct: [
            { product: "unleaded", beginning: 780000, receipts: 150000, deliveries: 125000, ending: 805000 },
            { product: "diesel", beginning: 580000, receipts: 200000, deliveries: 160000, ending: 620000 },
            { product: "premium", beginning: 165000, receipts: 50000, deliveries: 40000, ending: 175000 },
          ],
        },
        lastSubmitted: "2024-12-31",
      };
    }),
});
