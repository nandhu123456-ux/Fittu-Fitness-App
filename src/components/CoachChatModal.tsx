import { Modal } from 'react-native';

import CoachScreen from '../screens/CoachScreen';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Presents the existing AI Coach chat as a modal so the Coach tab can host the
 * Profile UI. All chat state and logic stays inside CoachScreen — this only
 * owns presentation and passes the close handler down.
 */
export function CoachChatModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <CoachScreen onClose={onClose} />
    </Modal>
  );
}
