import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { User } from "./entities/user.entity.js";
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email } = createUserDto;
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }
  findOne(params: { id?: number; email?: string }): Promise<User | null> {
    return this.userRepository.findOneBy(params);
  }
  findAll() {
    this.logger.log(`Fetching all users`);
    return `This action returns all users with token`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
