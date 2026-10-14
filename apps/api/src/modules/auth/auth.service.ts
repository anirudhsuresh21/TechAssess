import jwt from 'jsonwebtoken';
import { UserRole, AuditAction } from '@techassess/shared';
import { User, IUser } from '../users/user.model';
import { config } from '../../config/environment';
import { AppError } from '../../middleware/errorHandler';
import { recordAudit } from '../audit/audit.service';

export async function loginUser(email: string, password: string, ipAddress?: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  await recordAudit({
    userId: user._id,
    userEmail: user.email,
    role: user.role,
    action: AuditAction.USER_LOGIN,
    resourceType: 'User',
    resourceId: user._id.toString(),
    ipAddress,
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function registerAdmin(
  userData: { name: string; email: string; password: string; role?: UserRole },
  creatorUser?: { id: string; email: string; role: string },
  ipAddress?: string
) {
  const existing = await User.findOne({ email: userData.email.toLowerCase() });
  if (existing) {
    throw new AppError('A user with this email address already exists', 409);
  }

  const passwordHash = await User.hashPassword(userData.password);
  const user = await User.create({
    name: userData.name,
    email: userData.email.toLowerCase(),
    passwordHash,
    role: userData.role || UserRole.ASSESSMENT_ADMIN,
    isActive: true,
  });

  await recordAudit({
    userId: creatorUser ? creatorUser.id : user._id,
    userEmail: creatorUser ? creatorUser.email : user.email,
    role: creatorUser ? creatorUser.role : user.role,
    action: AuditAction.USER_LOGIN,
    resourceType: 'User',
    resourceId: user._id.toString(),
    details: { createdUserEmail: user.email, role: user.role },
    ipAddress,
  });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
