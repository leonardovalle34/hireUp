export const checkout = async (
  auth: any,
  planType: 'monthly' | 'yearly' = 'monthly',
) => {
  const res = await fetch(
    'https://kuczdljitnzixxzflhil.supabase.co/functions/v1/checkout',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: auth.user.email,
        userId: auth.user.id,
        planType: planType,
      }),
    },
  );

  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  }
};
