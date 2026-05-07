import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSendOtp, useVerifyOtp } from '@/api/hooks';
import { CheckCircle, Mail, RefreshCw, ArrowLeft } from 'lucide-react';

const RESEND_COOLDOWN = 60; // seconds

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const purpose = (params.get('purpose') as 'verify_email' | 'change_email') || 'verify_email';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  // Auto-send OTP on mount
  useEffect(() => {
    if (email) sendOtp.mutate({ email, purpose });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    // Auto-submit when all 6 digits filled
    if (value && index === 5) {
      const code = [...next].join('');
      if (code.length === 6) submitCode(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      submitCode(pasted);
    }
  };

  const submitCode = (code: string) => {
    if (!email) { setError('No email address found. Please go back and try again.'); return; }
    verifyOtp.mutate(
      { email, code, purpose },
      {
        onSuccess: () => setDone(true),
        onError: (err: any) => {
          setError(err.response?.data?.error?.message || 'Invalid or expired code. Try again.');
          setDigits(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        },
      },
    );
  };

  const handleResend = () => {
    if (cooldown > 0 || !email) return;
    setDigits(['', '', '', '', '', '']);
    setError('');
    sendOtp.mutate({ email, purpose }, {
      onSuccess: () => setCooldown(RESEND_COOLDOWN),
      onError: () => setError('Failed to resend code. Please try again.'),
    });
  };

  const handleContinue = () => navigate('/dashboard');

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">No email address provided. Please register first.</p>
            <Link to="/register"><Button className="w-full">Register</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${done ? 'bg-green-100' : 'bg-blue-100'}`}>
            {done ? <CheckCircle className="h-7 w-7 text-green-600" /> : <Mail className="h-7 w-7 text-blue-600" />}
          </div>
          <CardTitle className="text-2xl">{done ? 'Email Verified!' : 'Verify your email'}</CardTitle>
          <CardDescription>
            {done
              ? 'Your email has been verified successfully.'
              : <>We sent a 6-digit code to <strong>{email}</strong></>}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">You can now access all features of Q-Flow.</p>
              <Button className="w-full" onClick={handleContinue}>Go to Dashboard</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center">{error}</div>
              )}

              {/* OTP digit inputs */}
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`h-12 w-11 rounded-lg border-2 text-center text-xl font-bold outline-none transition-colors
                      ${d ? 'border-primary bg-primary/5' : 'border-input bg-background'}
                      focus:border-primary focus:ring-2 focus:ring-primary/20
                      ${error ? 'border-destructive' : ''}
                    `}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => submitCode(digits.join(''))}
                disabled={digits.join('').length < 6 || verifyOtp.isPending}
              >
                {verifyOtp.isPending ? 'Verifying...' : 'Verify Code'}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || sendOtp.isPending}
                  className="flex items-center gap-1.5 mx-auto text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${sendOtp.isPending ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>

              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
