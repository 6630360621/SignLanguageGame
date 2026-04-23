import React, { useEffect } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

interface AuthProps {
  onAuthSuccess?: () => void;
  children?: React.ReactNode;
}

const AuthContent: React.FC<AuthProps> = ({ onAuthSuccess, children }) => {
  const { user } = useAuthenticator();

  useEffect(() => {
    if (user && onAuthSuccess) {
      console.log('✅ User authenticated in Auth component:', user);
      onAuthSuccess();
    }
  }, [user, onAuthSuccess]);

  return <>{children}</>;
};

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, children }) => {
  return (
    <Authenticator
      signUpAttributes={['email']}
      hideSignUp={false}
    >
      <AuthContent onAuthSuccess={onAuthSuccess}>
        {children}
      </AuthContent>
    </Authenticator>
  );
};

export default Auth;