import { UserRole } from '@techassess/shared';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../modules/users/user.model';
import { logger } from '../utils/logger';

async function main() {
  const email = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@techassess.local';
  const password = process.env.ADMIN_PASSWORD || process.argv[3] || 'Admin@123456';
  const name = process.env.ADMIN_NAME || process.argv[4] || 'Tech Club Super Administrator';

  try {
    await connectDatabase();

    let user = await User.findOne({ email: email.toLowerCase() });
    const passwordHash = await User.hashPassword(password);

    if (user) {
      user.name = name;
      user.passwordHash = passwordHash;
      user.role = UserRole.SUPER_ADMIN;
      user.isActive = true;
      await user.save();
      logger.info(`Updated existing administrator: ${email}`);
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      });
      logger.info(`Created new Super Administrator: ${email}`);
    }

    console.log('\n=============================================');
    console.log('Super Administrator Credentials:');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     ${UserRole.SUPER_ADMIN}`);
    console.log('=============================================\n');

    await disconnectDatabase();
    process.exit(0);
  } catch (error: any) {
    logger.error('Failed to create admin user', { error: error.message });
    process.exit(1);
  }
}

main();
