import { Router } from 'express';
import { healthController } from '../controllers';
import { asyncHandler } from '../middleware';

const router = Router();

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', asyncHandler(healthController.healthCheck));

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with service status
 * @access  Public
 */
router.get('/detailed', asyncHandler(healthController.detailedHealthCheck));

/**
 * @route   GET /health/ready
 * @desc    Readiness check for Kubernetes
 * @access  Public
 */
router.get('/ready', asyncHandler(healthController.readinessCheck));

/**
 * @route   GET /health/live
 * @desc    Liveness check for Kubernetes
 * @access  Public
 */
router.get('/live', healthController.livenessCheck);

/**
 * @route   GET /info
 * @desc    Get application info
 * @access  Public
 */
router.get('/info', healthController.getInfo);

export default router;
