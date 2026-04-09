import { roleRepository } from './role.repository';

export const roleService = {
  getRoles: () => roleRepository.findAll()
};
