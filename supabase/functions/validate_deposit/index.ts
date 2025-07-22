import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200, // Ensure 200 OK for preflight
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const { user_id, transaction_password, amount, tx_hash, reference_id, wallet_address } = await req.json()

  // Create Supabase client with service role key (for RLS bypass)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Detailed debug logging for troubleshooting
  console.log('DEBUG: request body =', { user_id, transaction_password, amount, tx_hash, reference_id, wallet_address });

  // Fetch user from profiles
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, transaction_password')
    .eq('id', user_id)
    .single()

  console.log('DEBUG: fetched user =', user);

  // Debug log for troubleshooting password mismatches
  console.log('DEBUG: stored password =', (user?.transaction_password || '').trim(), 'provided password =', (transaction_password || '').trim());

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    })
  }

  if ((user.transaction_password || '').trim() !== (transaction_password || '').trim()) {
    return new Response(JSON.stringify({ error: 'Invalid transaction password' }), {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    })
  }

  // Create the deposit transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert([{
      user_id,
      type: 'deposit',
      amount,
      tx_hash,
      status: 'pending',
      reference_id,
      wallet_address
    }])

  if (txError) {
    return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  })
}) 