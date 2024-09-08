// test-clerk.js
import { createClerkClient } from '@clerk/clerk-sdk-node';
import * as dotenv from 'dotenv';

dotenv.config();

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

(async () => {
  try {
    const users = await clerkClient.users.getUserList({
      limit: 10,
      orderBy: '-created_at',
    });
    console.log("Fetched users: ", users);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
})();
