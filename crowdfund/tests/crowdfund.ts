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
    const goal = new anchor.BN(1000);
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 86400); // 1 day from now
    const createdAt = new anchor.BN(now);

    // Derive campaign PDA
    const [campaignPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('campaign'),
        owner.publicKey.toBuffer(),
        createdAt.toArrayLike(Buffer, 'le', 8),
      ],
      program.programId
    );

    await program.methods
      .createCampaign(name, description, goal, deadline, createdAt)
      .accounts({
        owner: owner.publicKey,
      })
      .rpc();

    const campaignAccount = await program.account.campaign.fetch(campaignPda);
    // Check fields
    expect(campaignAccount.name).to.equal(name);
    expect(campaignAccount.description).to.equal(description);
    expect(campaignAccount.owner.toBase58()).to.equal(
      owner.publicKey.toBase58()
    );
    expect(campaignAccount.goal.toString()).to.equal(goal.toString());
    expect(campaignAccount.deadline.toString()).to.equal(deadline.toString());
    expect(campaignAccount.totalAmountDonated.toNumber()).to.equal(0);
  });

  it('Donates to a campaign!', async () => {
    const provider = anchor.AnchorProvider.env();
    const owner = provider.wallet as anchor.Wallet;
    const name = 'Donate Test';
    const description = 'A campaign to test donations.';
    const goal = new anchor.BN(5000);
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 86400); // 1 day from now
    const createdAt = new anchor.BN(now);

    // Derive campaign PDA
    const [campaignPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('campaign'),
        owner.publicKey.toBuffer(),
        createdAt.toArrayLike(Buffer, 'le', 8),
      ],
      program.programId
    );

    const [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('treasury'), campaignPda.toBuffer()],
      program.programId
    );

    // Create the campaign
    await program.methods
      .createCampaign(name, description, goal, deadline, createdAt)
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
        treasury: treasuryPda,
      })
      .rpc();

    const campaignAccount = await program.account.campaign.fetch(campaignPda);
    expect(campaignAccount.totalAmountDonated.toString()).to.equal(
      donationAmount.toString()
    );
  });

  it('Allows contributor to withdraw if campaign failed', async () => {
    const provider = anchor.AnchorProvider.env();
    const owner = provider.wallet as anchor.Wallet;
    const name = 'Fail Campaign';
    const description = 'A campaign that will fail.';
    const goal = new anchor.BN(1_000_000_000); // 1 SOL (set high so it fails)
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 2); // 2 seconds from now
    const createdAt = new anchor.BN(now);

    // Derive campaign PDA
    const [campaignPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('campaign'),
        owner.publicKey.toBuffer(),
        createdAt.toArrayLike(Buffer, 'le', 8),
      ],
      program.programId
    );

    // Derive treasury PDA
    const [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('treasury'), campaignPda.toBuffer()],
      program.programId
    );
    const [contributorRecordPda] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from('contributor'),
          campaignPda.toBuffer(),
          owner.publicKey.toBuffer(),
        ],
        program.programId
      );

    // Create the campaign
    await program.methods
      .createCampaign(name, description, goal, deadline, createdAt)
      .accounts({
        owner: owner.publicKey,
      })
      .rpc();

    // Donate to the campaign
    const donationAmount = new anchor.BN(100_000_000); // 0.1 SOL
    await program.methods
      .donateToCampaign(donationAmount)
      .accounts({
        campaign: campaignPda,
        contributor: owner.publicKey,
        treasury: treasuryPda,
      })
      .rpc();

    // Wait for deadline to pass
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get balances before withdrawal
    const before = await provider.connection.getBalance(owner.publicKey);

    // Withdraw if failed
    await program.methods
      .withdrawIfFailed()
      .accounts({
        contributorRecord: contributorRecordPda,
        treasury: treasuryPda,
      })
      .rpc();

    // Get balances after withdrawal
    const after = await provider.connection.getBalance(owner.publicKey);

    // Fetch contributor record
    const record = await program.account.contributorRecord.fetch(
      contributorRecordPda
    );
    expect(record.withdrawn).to.be.true;
    // The difference should be at least the donation (minus rent/fees)
    expect(after).to.be.greaterThan(before);
  });

  it('Allows owner to withdraw if campaign succeeded', async () => {
    const provider = anchor.AnchorProvider.env();
    const owner = provider.wallet as anchor.Wallet;
    const name = 'Success Campaign';
    const description = 'A campaign that will succeed.';
    const goal = new anchor.BN(1_000_000); // 0.001 SOL
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 2); // 2 seconds from now
    const createdAt = new anchor.BN(now);

    // Derive campaign PDA
    const [campaignPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('campaign'),
        owner.publicKey.toBuffer(),
        createdAt.toArrayLike(Buffer, 'le', 8),
      ],
      program.programId
    );

    const [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('treasury'), campaignPda.toBuffer()],
      program.programId
    );

    // Create the campaign
    await program.methods
      .createCampaign(name, description, goal, deadline, createdAt)
      .accounts({
        owner: owner.publicKey,
      })
      .rpc();

    // Donate to the campaign (meet the goal)
    await program.methods
      .donateToCampaign(goal)
      .accounts({
        campaign: campaignPda,
        contributor: owner.publicKey,
        treasury: treasuryPda,
      })
      .rpc();

    // Wait for deadline to pass
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get balances before withdrawal
    const before = await provider.connection.getBalance(owner.publicKey);

    // Withdraw by owner
    await program.methods
      .withdrawByOwner()
      .accounts({
        campaign: campaignPda,
        treasury: treasuryPda,
      })
      .rpc();

    // Get balances after withdrawal
    const after = await provider.connection.getBalance(owner.publicKey);

    // Fetch campaign account
    const campaignAccount = await program.account.campaign.fetch(campaignPda);
    expect(campaignAccount.withdrawnByOwner).to.be.true;
    // The difference should be at least the goal (minus rent/fees)
    expect(after).to.be.greaterThan(before);
  });

  it('Allows owner to cancel a campaign', async () => {
    const provider = anchor.AnchorProvider.env();
    const owner = provider.wallet as anchor.Wallet;
    const name = 'Cancel Campaign';
    const description = 'A campaign that will be cancelled.';
    const goal = new anchor.BN(1_000_000); // 0.001 SOL
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 2); // 2 seconds from now
    const createdAt = new anchor.BN(now);

    // Derive campaign PDA
    const [campaignPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('campaign'),
        owner.publicKey.toBuffer(),
        createdAt.toArrayLike(Buffer, 'le', 8),
      ],
      program.programId
    );

    const [treasuryPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('treasury'), campaignPda.toBuffer()],
      program.programId
    );

    // Create the campaign
    await program.methods
      .createCampaign(name, description, goal, deadline, createdAt)
      .accounts({
        owner: owner.publicKey,
      })
      .rpc();

    // Cancel the campaign
    await program.methods
      .cancelCampaign()
      .accounts({
        campaign: campaignPda,
      })
      .rpc();

    // Fetch campaign account
    const campaignAccount = await program.account.campaign.fetch(campaignPda);
    expect(campaignAccount.isCancelled).to.be.true;
  });
});
