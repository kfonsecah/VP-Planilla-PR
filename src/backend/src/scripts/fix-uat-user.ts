import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'ken';
  const newPassword = 'ken01';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  console.log(`Checking user: ${username}`);
  
  const user = await prisma.vpg_users.findFirst({
    where: { user_username: username }
  });

  if (user) {
    console.log('User found:', { id: user.user_id, role: user.user_role });
    
    // Reset password to ken01 to be 100% sure
    await prisma.vpg_users.update({
      where: { user_id: user.user_id },
      data: { 
        user_password: hashedPassword,
        user_role: 'admin' // Ensure he is admin
      }
    });
    console.log(`Password and role (admin) updated for user '${username}'.`);
  } else {
    console.log(`User '${username}' NOT found. Creating him...`);
    await prisma.vpg_users.create({
      data: {
        user_username: username,
        user_password: hashedPassword,
        user_role: 'admin',
        user_email: 'ken@example.com',
        user_first_name: 'Ken',
        user_last_name: 'UAT',
        user_middle_name: '',
        user_national_id: '000000000'
      }
    });
    console.log(`User '${username}' created with password 'ken01' and role 'admin'.`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
