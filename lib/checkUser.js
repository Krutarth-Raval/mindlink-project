import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      if (loggedInUser.credits === null || loggedInUser.credits === undefined) {
        const updatedUser = await db.user.update({
          where: { id: loggedInUser.id },
          data: { credits: 5 },
        });
        return updatedUser;
      }
      return loggedInUser;
    }

    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User";
    const email = user.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      console.error("No email address found for Clerk user:", user.id);
      return null;
    }

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: email,
        credits: 5, // Initial credits
      },
    });

    return newUser;
  } catch (error) {
    console.error("CRITICAL ERROR in checkUser:", error);
    return null; // Return null so the Header can handle it gracefully instead of crashing
  }
};
