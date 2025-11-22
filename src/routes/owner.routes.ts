import { Router } from 'express';

import { OwnerController } from '../controllers/owner.controller';

const router = Router();
const ownerController = new OwnerController();

router.get('/', ownerController.getAll.bind(ownerController));
router.get('/:id', ownerController.getOne.bind(ownerController));
router.post('/', ownerController.create.bind(ownerController));
router.put('/:id', ownerController.update.bind(ownerController));
router.delete('/:id', ownerController.delete.bind(ownerController));

export default router;
