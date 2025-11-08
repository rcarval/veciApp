import { useState } from 'react';

const useToast = () => {
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = (message, type = 'info', duration = 3000) => {
    setToastConfig({
      visible: true,
      message,
      type,
      duration,
    });
  };

  const hideToast = () => {
    setToastConfig(prev => ({ ...prev, visible: false }));
  };

  // Métodos de conveniencia
  const success = (message, duration) => showToast(message, 'success', duration);
  const error = (message, duration) => showToast(message, 'error', duration);
  const warning = (message, duration) => showToast(message, 'warning', duration);
  const info = (message, duration) => showToast(message, 'info', duration);

  return {
    toastConfig,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
  };
};

export default useToast;
