import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const { amount } = await req.json();

    const auth = btoa(
      `${Deno.env.get("RAZORPAY_KEY_ID")}:${Deno.env.get("RAZORPAY_KEY_SECRET")}`
    );

    const response = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        }),
      }
    );

    const order = await response.json();

    return new Response(JSON.stringify(order), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});