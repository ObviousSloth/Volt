import { useRouter } from 'expo-router';

import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/use-auth';

export default function SignUpRoute() {
  const router = useRouter();
  const { signUp } = useAuth();

  return (
    <AuthForm
      mode="sign-up"
      onSubmit={signUp}
      onSwitch={() => router.replace('/(auth)/sign-in')}
    />
  );
}
