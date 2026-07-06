import { NextResponse } from "next/server";
import webpush from "web-push";

// Initialize VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:test@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const { subscription, title, body } = await request.json();

    if (!subscription) {
      return NextResponse.json(
        { error: "Missing subscription object" },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: title || "New Notification",
      body: body || "You have a new message.",
      icon: "/icon.svg",
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
