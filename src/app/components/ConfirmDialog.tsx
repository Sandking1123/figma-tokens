import React from 'react';
import useConfirm from '../hooks/useConfirm';
import Button from './Button';
import Heading from './Heading';
import Modal from './Modal';

const ConfirmDialog = () => {
    const {onConfirm, onCancel, confirmState} = useConfirm();

    const confirmButton = React.useRef(null);

    React.useEffect(() => {
        setTimeout(() => {
            if (confirmButton.current) {
                confirmButton.current.focus();
            }
        }, 50);
    }, [confirmState.show, confirmButton]);

    return confirmState.show ? (
        <Modal isOpen close={onCancel}>
            <form onSubmit={onConfirm} className="flex justify-center flex-col text-center space-y-4">
                <div className="space-y-2">
                    <Heading>{confirmState?.text && confirmState.text}</Heading>
                    {confirmState?.description && <p className="text-xs"> {confirmState.description}</p>}
                </div>
                <div className="space-x-4">
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" buttonRef={confirmButton}>
                        Yes
                    </Button>
                </div>
            </form>
        </Modal>
    ) : null;
};
export default ConfirmDialog;
