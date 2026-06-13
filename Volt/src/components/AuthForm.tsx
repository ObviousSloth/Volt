import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VButton } from '@/components/ui/VButton';
import { VIcon } from '@/components/ui/VIcon';
import { VText } from '@/components/ui/VText';
import type { AuthResult } from '@/hooks/use-auth';

export type AuthMode = 'sign-in' | 'sign-up';

type Props = {
  mode: AuthMode;
  /**
   * Resolves ok:true on success (navigation is driven by the auth state change);
   * ok:true + pendingConfirmation when sign-up needs email verification; ok:false
   * with a message to display the error.
   */
  onSubmit: (email: string, password: string) => Promise<AuthResult>;
  /** Navigate to the other auth screen. */
  onSwitch: () => void;
};

const COPY: Record<AuthMode, { title: string; cta: string; switchPrompt: string; switchCta: string }> = {
  'sign-in': {
    title: 'Welcome back',
    cta: 'Sign in',
    switchPrompt: 'New to Volt?',
    switchCta: 'Create an account',
  },
  'sign-up': {
    title: 'Create account',
    cta: 'Sign up',
    switchPrompt: 'Already have an account?',
    switchCta: 'Sign in',
  },
};

export function AuthForm({ mode, onSubmit, onSwitch }: Props) {
  const insets = useSafeAreaInsets();
  const copy = COPY[mode];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await onSubmit(email, password);
      if (!result.ok) {
        setError(result.message);
      } else if ('pendingConfirmation' in result) {
        setPendingConfirmation(true);
      }
      // On a plain ok:true, the auth state change drives navigation away from here.
    } catch {
      // Auth calls surface messages via the result; an unexpected throw here is
      // a last-resort guard so the screen never crashes.
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (pendingConfirmation) {
    return (
      <ConfirmationNotice
        email={email.trim()}
        onBackToSignIn={onSwitch}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: VoltColors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled">
        {/* Wordmark */}
        <VText
          style={{
            fontFamily: VoltFonts.displayBlack,
            fontSize: 44,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: VoltColors.accent,
          }}>
          Volt
        </VText>
        <VText style={{ fontFamily: VoltFonts.mono, fontSize: 12, color: VoltColors.faint, marginTop: 2 }}>
          workout tracker
        </VText>

        <VText
          style={{
            fontFamily: VoltFonts.displayBold,
            fontSize: 26,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: VoltColors.text,
            marginTop: 36,
            marginBottom: 18,
          }}>
          {copy.title}
        </VText>

        <Field
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (error) setError(null);
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />

        <View style={{ height: 14 }} />

        <Field
          label="Password"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (error) setError(null);
          }}
          placeholder="At least 6 characters"
          secureTextEntry
          textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
          autoComplete={mode === 'sign-up' ? 'password-new' : 'password'}
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        {error ? (
          <View
            style={{
              marginTop: 14,
              borderWidth: 1,
              borderColor: VoltColors.danger,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
            }}>
            <VText style={{ color: VoltColors.danger, fontSize: 13 }}>{error}</VText>
          </View>
        ) : null}

        <VButton
          label={copy.cta}
          size="lg"
          onPress={submit}
          loading={submitting}
          style={{ marginTop: 22 }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          <VText style={{ fontSize: 13, color: VoltColors.dim }}>{copy.switchPrompt}</VText>
          <Pressable accessibilityRole="button" onPress={onSwitch} disabled={submitting}>
            <VText style={{ fontFamily: VoltFonts.bodyBold, fontSize: 13, color: VoltColors.accent }}>
              {copy.switchCta}
            </VText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };

function Field({ label, ...inputProps }: FieldProps) {
  return (
    <View>
      <VText
        style={{
          fontFamily: VoltFonts.bodyBold,
          fontSize: 12,
          color: VoltColors.dim,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 6,
        }}>
        {label}
      </VText>
      <TextInput
        {...inputProps}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={VoltColors.faint}
        style={{
          backgroundColor: VoltColors.surface,
          borderWidth: 1,
          borderColor: VoltColors.border,
          borderRadius: 14,
          paddingVertical: 13,
          paddingHorizontal: 14,
          color: VoltColors.text,
          fontFamily: VoltFonts.body,
          fontSize: 16,
        }}
      />
    </View>
  );
}

/** Shown after sign-up when email confirmation is required (contract §3). */
function ConfirmationNotice({
  email,
  onBackToSignIn,
}: {
  email: string;
  onBackToSignIn: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: VoltColors.bg,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 999,
          backgroundColor: VoltColors.surface,
          borderWidth: 1,
          borderColor: VoltColors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
        <VIcon name="check" size={30} color={VoltColors.accent} />
      </View>
      <VText
        style={{
          fontFamily: VoltFonts.displayBold,
          fontSize: 26,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: VoltColors.text,
          marginBottom: 12,
        }}>
        Check your inbox
      </VText>
      <VText style={{ fontSize: 15, lineHeight: 22, color: VoltColors.dim }}>
        We sent a confirmation link to{' '}
        <VText style={{ fontFamily: VoltFonts.bodyBold, color: VoltColors.text }}>{email}</VText>.
        Tap it to verify your email, then sign in.
      </VText>
      <VButton label="Back to sign in" kind="ghost" size="lg" onPress={onBackToSignIn} style={{ marginTop: 28 }} />
    </View>
  );
}
