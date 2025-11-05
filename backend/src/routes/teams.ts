import { Router } from 'express';
import { teamsController } from '../controllers/teams';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', teamsController.getTeams);
router.get('/:id', teamsController.getTeam);
router.post('/', teamsController.createTeam);
router.put('/:id', teamsController.updateTeam);
router.delete('/:id', teamsController.deleteTeam);
router.post('/:id/members', teamsController.addMember);
router.put('/:id/members/:memberId', teamsController.updateMemberRole);
router.delete('/:id/members/:memberId', teamsController.removeMember);
router.post('/:id/boards', teamsController.addBoard);
router.delete('/:id/boards/:boardId', teamsController.removeBoard);

export default router;

