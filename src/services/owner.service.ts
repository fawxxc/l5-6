import { getRepository } from 'typeorm';
import { Owner } from '../entities/owner.entity';
import { CreateOwnerDto } from '../dto/create-owner.dto';

export class OwnerService {

  async getAll() {
    const ownerRepository = getRepository(Owner);
    return await ownerRepository.find({
      relations: ['pets'],
    });
  }

  async getOne(id: number) {
    const ownerRepository = getRepository(Owner);
    return await ownerRepository.findOne({
      where: { id }, 
      relations: ['pets'],
    });
  }

  async create(data: CreateOwnerDto) {
    const ownerRepository = getRepository(Owner);
    const newOwner = ownerRepository.create(data);
    return await ownerRepository.save(newOwner);
  }

  async update(id: number, data: Partial<CreateOwnerDto>) {
    const ownerRepository = getRepository(Owner);
    await ownerRepository.update(id, data);
    return this.getOne(id);
  }

  async delete(id: number) {
    const ownerRepository = getRepository(Owner);
    return await ownerRepository.delete(id);
  }
}
