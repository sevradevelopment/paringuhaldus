import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { handleStripeEvent } from "@/lib/stripe/webhooks";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook pole seadistatud" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Puudub allkiri" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Allkirja kontroll ebaõnnestus";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[stripe.webhook]", error);
    return NextResponse.json(
      { error: "Webhook töötlemine ebaõnnestus" },
      { status: 500 },
    );
  }
}
