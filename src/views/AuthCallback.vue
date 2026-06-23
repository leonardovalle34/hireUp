<script setup lang="ts">
  import { onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { supabase } from '@/lib/supabase';

  const router = useRouter();

  onMounted(async () => {
    const { error } = await supabase.auth.exchangeCodeForSession(
      window.location.href,
    );

    if (error) {
      console.error('Auth callback error:', error);
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  });
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <p>Autenticando...</p>
  </div>
</template>
