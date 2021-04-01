import DockWallet from './dock-wallet';

class EDVWallet extends DockWallet {
  constructor(id) {
    super(id);
    // Pass id on constructor which is the ID of an EDV
  }
}

export default EDVWallet;
