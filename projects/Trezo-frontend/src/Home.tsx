// src/components/Home.tsx
import React, { useState } from "react";
import CreateWallet from "./components/CreateWallet";

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openCreateWalletModal, setOpenCreateWalletModal] = useState<boolean>(false);

  const toggleCreateWalletModal = () => {
    setOpenCreateWalletModal(!openCreateWalletModal);
  };

  return (
    <div className="hero">
      <div className="hero-content">
        <div className="max-w-md">
          <h1 className="app-title">
            Welcome to <span>Trezo</span>
          </h1>
          <p className="app-subtitle">Your secure Algorand wallet creation platform. Create and manage your Algorand wallets with ease.</p>

          <div className="btn-grid">
            <button data-test-id="create-wallet" className="btn btn-primary" onClick={toggleCreateWalletModal}>
              <span className="emoji">💼</span>
              Create New Wallet
            </button>

            <div className="divider" />

            <a
              data-test-id="getting-started"
              className="btn btn-secondary"
              target="_blank"
              href="https://github.com/algorandfoundation/algokit-cli"
            >
              <span className="emoji">📚</span>
              Learn More
            </a>
          </div>

          <CreateWallet openModal={openCreateWalletModal} closeModal={toggleCreateWalletModal} />
        </div>
      </div>
    </div>
  );
};

export default Home;
