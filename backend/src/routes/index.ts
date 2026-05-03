import { Router, Request, Response } from 'express';
import authController from '../controllers/authController';
import serviceController from '../controllers/serviceController';
import resourceController from '../controllers/resourceController';
import bookingController from '../controllers/bookingController';
import paymentController from '../controllers/paymentController';
import dashboardController from '../controllers/dashboardController';
import profileController from '../controllers/profileController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// ============================================================
// AUTH ROUTES
// ============================================================
router.post('/auth/register', authController.validateRegister, (req: Request, res: Response) => authController.register(req, res));
router.post('/auth/login', authController.validateLogin, (req: Request, res: Response) => authController.login(req, res));
router.post('/auth/verify-otp', (req: Request, res: Response) => authController.verifyOTP(req, res));
router.post('/auth/resend-otp', (req: Request, res: Response) => authController.resendOTP(req, res));
router.post('/auth/logout', authenticateToken, (req: Request, res: Response) => authController.logout(req as AuthRequest, res));

// ============================================================
// SERVICE ROUTES
// ============================================================
router.get('/services', (req: Request, res: Response) => serviceController.getAllServices(req, res));
router.get('/services/:id', (req: Request, res: Response) => serviceController.getServiceById(req, res));
router.post('/services', authenticateToken, authorizeRole('ORGANISER'), serviceController.validateCreateService, (req: Request, res: Response) => serviceController.createService(req as AuthRequest, res));
router.put('/services/:id', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => serviceController.updateService(req as AuthRequest, res));
router.delete('/services/:id', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => serviceController.deleteService(req as AuthRequest, res));
router.get('/organiser/services', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => serviceController.getOrganiserServices(req as AuthRequest, res));

// ============================================================
// RESOURCE ROUTES (Organiser only)
// ============================================================
router.get('/resources', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => resourceController.getOrganiserResources(req as AuthRequest, res));
router.get('/resources/:id', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => resourceController.getResourceById(req as AuthRequest, res));
router.post('/resources', authenticateToken, authorizeRole('ORGANISER'), resourceController.validateCreateResource, (req: Request, res: Response) => resourceController.createResource(req as AuthRequest, res));
router.put('/resources/:id', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => resourceController.updateResource(req as AuthRequest, res));
router.delete('/resources/:id', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => resourceController.deleteResource(req as AuthRequest, res));

// Schedule routes
router.get('/resources/:resourceId/schedules', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => resourceController.getResourceSchedules(req as AuthRequest, res));
router.post('/resources/:resourceId/schedules', authenticateToken, authorizeRole('ORGANISER'), resourceController.validateCreateSchedule, (req: Request, res: Response) => resourceController.createSchedule(req as AuthRequest, res));
router.put('/schedules/:id', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => resourceController.updateSchedule(req as AuthRequest, res));
router.delete('/schedules/:id', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => resourceController.deleteSchedule(req as AuthRequest, res));

// Exception routes
router.get('/resources/:resourceId/exceptions', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => resourceController.getResourceExceptions(req as AuthRequest, res));
router.post('/resources/:resourceId/exceptions', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => resourceController.createException(req as AuthRequest, res));
router.delete('/exceptions/:id', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => resourceController.deleteException(req as AuthRequest, res));

// ============================================================
// AVAILABILITY ROUTES
// ============================================================
router.get('/availability', authenticateToken, (req: Request, res: Response) => bookingController.getAvailableSlots(req as AuthRequest, res));

// ============================================================
// BOOKING ROUTES
// ============================================================
router.get('/bookings', authenticateToken, (req: Request, res: Response) => bookingController.getBookings(req as AuthRequest, res));
router.get('/bookings/:id', authenticateToken, (req: Request, res: Response) => bookingController.getBookingById(req as AuthRequest, res));
router.post('/bookings', authenticateToken, authorizeRole('CUSTOMER'), bookingController.validateCreateBooking, (req: Request, res: Response) => bookingController.createBooking(req as AuthRequest, res));
router.put('/bookings/:id/status', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => bookingController.updateBookingStatus(req as AuthRequest, res));
router.put('/bookings/:id/reschedule', authenticateToken, authorizeRole('CUSTOMER'), (req: Request, res: Response) => bookingController.rescheduleBooking(req as AuthRequest, res));
router.delete('/bookings/:id', authenticateToken, (req: Request, res: Response) => bookingController.cancelBooking(req as AuthRequest, res));

// ============================================================
// PAYMENT ROUTES
// ============================================================
router.post('/payments', authenticateToken, authorizeRole('CUSTOMER'), (req: Request, res: Response) => paymentController.processPayment(req as AuthRequest, res));
router.get('/payments/:transactionId', authenticateToken, (req: Request, res: Response) => paymentController.getPaymentStatus(req as AuthRequest, res));

// ============================================================
// PROFILE ROUTES (all authenticated users)
// ============================================================
router.get('/profile', authenticateToken, (req: Request, res: Response) => profileController.getProfile(req as AuthRequest, res));
router.put('/profile', authenticateToken, profileController.validateUpdate, (req: Request, res: Response) => profileController.updateProfile(req as AuthRequest, res));
router.put('/profile/password', authenticateToken, profileController.validateChangePassword, (req: Request, res: Response) => profileController.changePassword(req as AuthRequest, res));
router.delete('/profile', authenticateToken, (req: Request, res: Response) => profileController.deleteAccount(req as AuthRequest, res));

// ============================================================
// DASHBOARD ROUTES
// ============================================================
router.get('/dashboard/organiser', authenticateToken, authorizeRole('ORGANISER'), (req: Request, res: Response) => dashboardController.getOrganiserDashboard(req as AuthRequest, res));
router.get('/dashboard/admin', authenticateToken, authorizeRole('ADMIN'), (req: Request, res: Response) => dashboardController.getAdminDashboard(req as AuthRequest, res));
router.put('/users/:id/deactivate', authenticateToken, authorizeRole('ADMIN'), (req: Request, res: Response) => dashboardController.deactivateUser(req as AuthRequest, res));

export default router;
