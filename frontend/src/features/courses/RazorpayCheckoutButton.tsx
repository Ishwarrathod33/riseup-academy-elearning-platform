"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError, getErrorMessage } from "@/lib/api";
import { refreshAccessToken } from "@/lib/auth";
import { STORAGE_KEYS } from "@/lib/constants";
import { cn } from "@/lib/cn";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

async function ensureRazorpayLoaded() {
  if (typeof window === "undefined") return;
  if (window.Razorpay) return;

  const scriptId = "razorpay-checkout-script";
  if (document.getElementById(scriptId)) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}

export function RazorpayCheckoutButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function ensureAccessTokenOrRedirect() {
    const token = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (token) return token;
    try {
      const refreshed = await refreshAccessToken();
      localStorage.setItem(STORAGE_KEYS.accessToken, refreshed.accessToken);
      return refreshed.accessToken;
    } catch {
      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      const redirect = encodeURIComponent(current || "/courses");
      router.push(`/login?redirect=${redirect}`);
      return null;
    }
  }

  async function createPaymentWithAuthRetry() {
    try {
      return await apiFetch<{
        keyId: string;
        orderId: string;
        amount: number;
        currency: string;
        dummy?: boolean;
        enrolled?: boolean;
      }>("/api/payments/create", { method: "POST", json: { courseId } });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        const refreshed = await ensureAccessTokenOrRedirect();
        if (!refreshed) return null;
        return await apiFetch<{
          keyId: string;
          orderId: string;
          amount: number;
          currency: string;
          dummy?: boolean;
          enrolled?: boolean;
        }>("/api/payments/create", { method: "POST", json: { courseId } });
      }
      throw e;
    }
  }

  async function onBuy() {
    setErr(null);
    setLoading(true);

    try {
      const token = await ensureAccessTokenOrRedirect();
      if (!token) return;

      // Free courses (price=0) should bypass Razorpay.
      const courseDetails = await apiFetch<{ course: any }>(`/api/courses/${encodeURIComponent(courseId)}`, {
        auth: false,
      });
      if (Number(courseDetails.course?.price ?? 0) <= 0) {
        const verify = await createPaymentWithAuthRetry();
        if (!verify) return;
        if (verify.enrolled) router.push(`/payments/success?courseId=${encodeURIComponent(courseId)}`);
        else router.push(`/payments/fail?courseId=${encodeURIComponent(courseId)}`);
        return;
      }

      const order = await createPaymentWithAuthRetry();
      if (!order) return;

      if (order.dummy || order.enrolled) {
        router.push(`/payments/success?courseId=${encodeURIComponent(courseId)}`);
        return;
      }

      await ensureRazorpayLoaded();

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "RiseUp Academy",
        description: "Course enrollment",
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            const verify = await apiFetch<{ ok: true; enrolled: boolean }>(
              "/api/payments/verify",
              {
                method: "POST",
                json: {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
              }
            );
            if (verify.enrolled) router.push(`/payments/success?courseId=${encodeURIComponent(courseId)}`);
            else router.push(`/payments/fail?courseId=${encodeURIComponent(courseId)}`);
          } catch {
            router.push(`/payments/fail?courseId=${encodeURIComponent(courseId)}`);
          }
        },
        prefill: {
          email: "",
          contact: "",
        },
        theme: {
          color: "#7c3aed",
        },
        modal: {
          ondismiss: function () {
            router.push(`/payments/fail?courseId=${encodeURIComponent(courseId)}`);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Payment failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-2">
      <Button className={cn("w-full rounded-2xl bg-violet-700 hover:bg-violet-800", loading ? "opacity-80" : "")} onClick={onBuy} disabled={loading}>
        {loading ? "Processing..." : "Buy Now"}
      </Button>
      {err ? <div className="mt-2 text-sm text-red-600">{err}</div> : null}
    </div>
  );
}
