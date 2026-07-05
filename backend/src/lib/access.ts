import { prisma } from "../prismaClient.js";

export async function verifyEnrollment(
  userId: string,
  courseId: string
) {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  return (
    enrollment &&
    enrollment.status === "ACTIVE"
  );
}