import React from 'react';
import { UniversalIdleModal, UniversalIdleModalProps } from './UniversalIdleModal';

export const PythonIdleModal: React.FC<UniversalIdleModalProps> = React.memo((props) => {
  return <UniversalIdleModal {...props} language={props.language || 'python'} />;
});
