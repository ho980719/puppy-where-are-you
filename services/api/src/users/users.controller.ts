import { Controller, Get } from '@nestjs/common';
import { ApiResponse, UserDTO } from '@puppy/shared';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(): Promise<ApiResponse<UserDTO[]>> {
    const users = await this.usersService.findAll();
    return { data: users as unknown as UserDTO[] };
  }
}
