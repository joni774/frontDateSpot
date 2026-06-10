import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps & { className?: string }) {
  return (
    <View className="mb-4">
      {label ? (
        <Text className="text-gray-700 text-sm font-medium mb-1">{label}</Text>
      ) : null}
      <TextInput
        className={`border border-gray-300 rounded-xl px-4 py-3 text-base bg-white ${error ? 'border-red-500' : ''} ${className ?? ''}`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error ? <Text className="text-red-500 text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
