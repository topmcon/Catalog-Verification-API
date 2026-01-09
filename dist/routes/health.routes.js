"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (0, middleware_1.asyncHandler)(controllers_1.healthController.healthCheck));
/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with service status
 * @access  Public
 */
router.get('/detailed', (0, middleware_1.asyncHandler)(controllers_1.healthController.detailedHealthCheck));
/**
 * @route   GET /health/ready
 * @desc    Readiness check for Kubernetes
 * @access  Public
 */
router.get('/ready', (0, middleware_1.asyncHandler)(controllers_1.healthController.readinessCheck));
/**
 * @route   GET /health/live
 * @desc    Liveness check for Kubernetes
 * @access  Public
 */
router.get('/live', controllers_1.healthController.livenessCheck);
/**
 * @route   GET /info
 * @desc    Get application info
 * @access  Public
 */
router.get('/info', controllers_1.healthController.getInfo);
exports.default = router;
//# sourceMappingURL=health.routes.js.map