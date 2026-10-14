import { Request, Response, NextFunction } from 'express';
import { loginUser, registerAdmin } from './auth.service';
import { User } from '../users/user.model';
import { AppError } from '../../middleware/errorHandler';

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password, req.ip);

    // Set HTTP-only secure cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(req: Request, res: Response) {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function getMeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function registerAdminHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const creator = req.user
      ? { id: req.user.userId, email: req.user.email, role: req.user.role }
      : undefined;
    const user = await registerAdmin(req.body, creator, req.ip);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
