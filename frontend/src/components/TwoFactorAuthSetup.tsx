import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

type Props = {
  onClose: () => void;
};

const TwoFactorAuthSetup = ({ onClose }: Props) => {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const generateSecret = async () => {
      try {
        const response = await api.post('/auth/2fa/generate');
        setQrCode(response.data.data.qrCodeDataURL);
        setSecret(response.data.data.secret);
      } catch (err) {
        setError('Could not generate a 2FA secret. Please try again.');
        showToast('Failed to start 2FA setup.', 'error');
      } finally {
        setLoading(false);
      }
    };
    generateSecret();
  }, [showToast]);

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/2fa/verify-enable', { token });
      const codes = response.data.data?.recoveryCodes || [];
      setRecoveryCodes(codes);
      setShowRecoveryCodes(true);
      showToast('2FA has been enabled successfully!', 'success');
      // Invalidate user query to refetch user data with 2FA enabled
      queryClient.invalidateQueries({ queryKey: ['user'] }); 
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Invalid token. Please try again.', 'error');
    }
  };

  const handleDownloadRecoveryCodes = () => {
    const text = recoveryCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    showToast('Recovery codes copied to clipboard', 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">
          {showRecoveryCodes ? 'Save Your Recovery Codes' : 'Set Up Two-Factor Authentication'}
        </h2>
        {loading && <p>Generating secret...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {showRecoveryCodes ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                ?? Important: Save these recovery codes
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Store these codes in a safe place. Each code can be used once to access your account if you lose your authenticator device.
              </p>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleDownloadRecoveryCodes}
                className="flex-1 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Download
              </button>
              <button
                onClick={handleCopyRecoveryCodes}
                className="flex-1 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Copy
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-md bg-monday-primary text-white hover:bg-monday-primaryHover transition-colors"
            >
              I've Saved My Codes
            </button>
          </div>
        ) : qrCode && (
          <>
            <p className="mb-4">Scan the QR code below with your authenticator app (like Google Authenticator, Authy, or 1Password).</p>
            <div className="flex justify-center my-4">
              <img src={qrCode} alt="QR Code" />
            </div>
            <p className="mb-4">If you can't scan the QR code, you can manually enter this secret:</p>
            <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-center font-mono my-4">{secret}</p>
            
            <form onSubmit={handleVerifyAndEnable}>
              <label htmlFor="token" className="block text-sm font-medium mb-1">Verification Code</label>
              <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full p-2 border rounded-md mb-4"
                placeholder="Enter the code from your app"
                required
              />
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-monday-primary text-white">Verify & Enable</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuthSetup;


