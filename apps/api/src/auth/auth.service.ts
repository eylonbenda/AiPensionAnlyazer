import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@pension-analyzer/database';
import { User } from '@pension-analyzer/domain';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthResult {
  accessToken: string;
  user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    return this.login(this.toUser(user));
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'> | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    return this.toUser(user);
  }

  async login(
    user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>,
  ): Promise<AuthResult> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, user };
  }

  async getUserById(
    id: string,
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'> | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? this.toUser(user) : null;
  }

  private toUser(
    row: { id: string; email: string; name: string | null; createdAt: Date; updatedAt: Date },
  ): Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'> {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
