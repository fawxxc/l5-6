import { Request, Response } from 'express';

import { OwnerService } from '../services/owner.service';

const ownerService = new OwnerService();

export class OwnerController {
  async getAll(req: Request, res: Response) {
    try {
      const owners = await ownerService.getAll();
      res.json(owners);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const owner = await ownerService.getOne(Number(req.params.id));
      if (!owner) return res.status(404).json({ message: 'Owner not found' });
      return res.json(owner);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const newOwner = await ownerService.create(req.body);
      res.status(201).json(newOwner);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const updated = await ownerService.update(Number(req.params.id), req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await ownerService.delete(Number(req.params.id));
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
