import { useRouter } from 'expo-router';

import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/use-auth';

export default function SignInRoute() {
  const router = useRouter();
  const { signIn } = useAuth();

  return (
    <AuthForm
      mode="sign-in"
      onSubmit={signIn}
      onSwitch={() => router.replace('/(auth)/sign-up')}
    />
  );
}
