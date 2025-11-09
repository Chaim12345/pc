import { Router } from 'express';
import { usersController, uploadMiddleware } from '../controllers/users';
import { authenticate } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/', usersController.getUsersInOrganization);
router.get('/all', usersController.getAllUsers);
router.post('/invite', usersController.inviteUser);
router.put('/:id/status', usersController.updateUserStatus);
router.put('/:id/role', usersController.updateUserRole);
router.delete('/:id', usersController.deleteUser);
router.post('/bulk', usersController.bulkUpdateUsers);
router.get('/me/profile', usersController.getProfile);
router.put('/me/profile', usersController.updateProfile);
router.put('/me/password', usersController.changePassword);
router.put('/me/avatar', uploadMiddleware, usersController.uploadAvatar);
router.get('/search', usersController.searchUsers);
router.get('/:id', usersController.getUserById);

export default router;

