import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Crowdfund } from '../target/types/crowdfund';
import { expect } from 'chai';

describe('crowdfund', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.crowdfund as Program<Crowdfund>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log('Your transaction signature', tx);
  });

  it('Creates a campaign!', async () => {
    const provider = anchor.AnchorProvider.env();
    const owner = provider.wallet as anchor.Wallet;
    const name = 'Test Campaign';
    const description = 'A test campaign for unit testing.';
    const targetAmount = new anchor.BN(1000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400); // 1 day from now

    // Derive PDA
    const [campaignPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('campaign'), owner.publicKey.toBuffer(), Buffer.from(name)],
      program.programId
    );

    await program.methods
      .createCampaign(name, description, targetAmount, deadline)
      .accounts({
        owner: owner.publicKey,
        // campaign: campaignPda,
        // owner: owner.publicKey,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const campaignAccount = await program.account.campaign.fetch(campaignPda);
    // Check fields
    expect(campaignAccount.name).to.equal(name);
    expect(campaignAccount.description).to.equal(description);
    expect(campaignAccount.owner.toBase58()).to.equal(
      owner.publicKey.toBase58()
    );
    expect(campaignAccount.targetAmount.toString()).to.equal(
      targetAmount.toString()
    );
    expect(campaignAccount.deadline.toString()).to.equal(deadline.toString());
    expect(campaignAccount.totalAmountDonated.toNumber()).to.equal(0);
  });

  it('Donates to a campaign!', async () => {
    const provider = anchor.AnchorProvider.env();
    const owner = provider.wallet as anchor.Wallet;
    const name = 'Donate Test';
    const description = 'A campaign to test donations.';
    const targetAmount = new anchor.BN(5000);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400); // 1 day from now

    // Derive PDA
    const [campaignPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('campaign'), owner.publicKey.toBuffer(), Buffer.from(name)],
      program.programId
    );

    // Create the campaign
    await program.methods
      .createCampaign(name, description, targetAmount, deadline)
      .accounts({
        owner: owner.publicKey,
      })
      .rpc();

    // Donate to the campaign
    const donationAmount = new anchor.BN(1_000_000); // 0.001 SOL
    await program.methods
      .donateToCampaign(donationAmount)
      .accounts({
        campaign: campaignPda,
        contributor: owner.publicKey,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const campaignAccount = await program.account.campaign.fetch(campaignPda);
    expect(campaignAccount.totalAmountDonated.toString()).to.equal(
      donationAmount.toString()
    );
  });
});
