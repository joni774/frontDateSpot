import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

export interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  const base = 'rounded-xl px-6 py-3 items-center justify-center';
  const variants = {
    primary: 'bg-primary',
    secondary: 'bg-cream',
    outline: 'border-2 border-primary bg-transparent',
  };
  const textVariants = {
    primary: 'text-white font-semibold text-base',
    secondary: 'text-text font-semibold text-base',
    outline: 'text-primary font-semibold text-base',
  };

  return (
    <Pressable
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#B84A62' : '#fff'} />
      ) : (
        <Text className={textVariants[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}
