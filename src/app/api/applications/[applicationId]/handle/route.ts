import { getUserFromSession } from '@/utils/auth';
import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ✅ Correct type for Next.js App Router params
export async function PATCH(
  req: NextRequest,
  context: any
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract and validate ID
    const applicationId = Number(context.params.applicationId); 
    if (!applicationId || isNaN(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const { action }: { action: 'accept' | 'reject' } = await req.json();
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: { include: { profile: true } },
        projectRequiredRole: { include: { project: true } },
      },
    });

    if (!application?.projectRequiredRole?.project) {
      return NextResponse.json({ error: 'Invalid application' }, { status: 404 });
    }

    const project = application.projectRequiredRole.project;

    // Ensure only the project owner can accept/reject
    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Reject
    if (action === 'reject') {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'Rejected' },
      });
      return NextResponse.json({ success: true, status: 'Rejected' });
    }

    // Accept
    const alreadyPartnered = await prisma.partnership.findFirst({
      where: { projectId: project.id, userId: application.userId },
    });

    if (!alreadyPartnered) {
      await prisma.partnership.create({
        data: {
          projectId: project.id,
          userId: application.userId,
          role: application.projectRequiredRole.role,
        },
      });
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'Accepted' },
    });

    return NextResponse.json({ success: true, status: 'Accepted' });
  } catch (err) {
    console.error('ERROR accepting/rejecting application:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
