import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: {
    name: string;
    phone: string;
    password: string;
    role: UserRole;
  }) {
    if (input.role !== UserRole.DOCTOR) {
      throw new ForbiddenException('Public registration is only allowed for DOCTOR role');
    }

    const exists = await this.prisma.user.findUnique({
      where: { phone: input.phone },
    });
    if (exists)
      throw new ConflictException('Phone number is already registered');
    const passwordHash = await bcrypt.hash(input.password, 12);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 3);

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        passwordHash,
        role: input.role,
        subscription: {
          create: {
            status: SubscriptionStatus.TRIAL,
            trialEndsAt,
            expiresAt: trialEndsAt,
          },
        },
      },
    });

    return this.token(user.id, user.role);
  }

  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid phone number or password');
    }
    return this.token(user.id, user.role);
  }

  private token(sub: string, role: UserRole) {
    return {
      accessToken: this.jwt.sign({ sub, role }),
      user: { id: sub, role },
    };
  }
}
