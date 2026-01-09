"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = healthCheck;
exports.detailedHealthCheck = detailedHealthCheck;
exports.readinessCheck = readinessCheck;
exports.livenessCheck = livenessCheck;
exports.getInfo = getInfo;
const services_1 = require("../services");
const openaiService = __importStar(require("../services/openai.service"));
const xaiService = __importStar(require("../services/xai.service"));
const salesforceService = __importStar(require("../services/salesforce.service"));
const config_1 = __importDefault(require("../config"));
/**
 * Health Controller
 * Handles health check endpoints
 */
/**
 * Basic health check
 */
async function healthCheck(_req, res) {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
}
/**
 * Detailed health check with service status
 */
async function detailedHealthCheck(_req, res) {
    const timestamp = new Date().toISOString();
    // Check all services in parallel
    const [dbHealth, openaiHealth, xaiHealth, salesforceHealth] = await Promise.all([
        services_1.databaseService.healthCheck(),
        openaiService.healthCheck(),
        xaiService.healthCheck(),
        salesforceService.healthCheck(),
    ]);
    // Determine overall status
    const services = {
        database: {
            status: dbHealth.status,
            latencyMs: dbHealth.latencyMs,
            lastChecked: timestamp,
            error: dbHealth.error,
        },
        openai: {
            status: openaiHealth.status,
            latencyMs: openaiHealth.latencyMs,
            lastChecked: timestamp,
            error: openaiHealth.error,
        },
        xai: {
            status: xaiHealth.status,
            latencyMs: xaiHealth.latencyMs,
            lastChecked: timestamp,
            error: xaiHealth.error,
        },
        salesforce: {
            status: salesforceHealth.status,
            latencyMs: salesforceHealth.latencyMs,
            lastChecked: timestamp,
            error: salesforceHealth.error,
        },
    };
    // Determine overall health
    let overallStatus = 'healthy';
    const downServices = Object.values(services).filter(s => s.status === 'down');
    if (downServices.length > 0) {
        // Database down = unhealthy, other services down = degraded
        if (services.database.status === 'down') {
            overallStatus = 'unhealthy';
        }
        else {
            overallStatus = 'degraded';
        }
    }
    const response = {
        status: overallStatus,
        version: process.env.npm_package_version || '1.0.0',
        timestamp,
        services,
    };
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(response);
}
/**
 * Readiness check (for Kubernetes)
 */
async function readinessCheck(_req, res) {
    const dbHealth = await services_1.databaseService.healthCheck();
    if (dbHealth.status === 'up') {
        res.status(200).json({ ready: true });
    }
    else {
        res.status(503).json({ ready: false, reason: 'Database unavailable' });
    }
}
/**
 * Liveness check (for Kubernetes)
 */
function livenessCheck(_req, res) {
    res.status(200).json({ alive: true });
}
/**
 * Get application info
 */
function getInfo(_req, res) {
    res.status(200).json({
        name: 'Catalog Verification API',
        version: process.env.npm_package_version || '1.0.0',
        environment: config_1.default.env,
        nodeVersion: process.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
}
exports.default = {
    healthCheck,
    detailedHealthCheck,
    readinessCheck,
    livenessCheck,
    getInfo,
};
//# sourceMappingURL=health.controller.js.map