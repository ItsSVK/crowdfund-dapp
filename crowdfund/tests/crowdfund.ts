import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Crowdfund } from '../target/types/crowdfund';
import { expect } from 'chai';

describe('crowdfund', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.crowdfund as Program<Crowdfund>;
  const provider = anchor.AnchorProvider.env();

  let testCounter = 0;

  // Helper function to get PDAs
  function getCampaignPda(owner: anchor.web3.PublicKey, createdAt: anchor.BN) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('campaign'),
        owner.toBuffer(),
        createdAt.toArrayLike(Buffer, 'le', 8),
      ],
      program.programId
    )[0];
  }

  function getTreasuryPda(campaignPda: anchor.web3.PublicKey) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('treasury'), campaignPda.toBuffer()],
      program.programId
    )[0];
  }

  function getContributorRecordPda(
    campaignPda: anchor.web3.PublicKey,
    contributor: anchor.web3.PublicKey
  ) {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('contributor'),
        campaignPda.toBuffer(),
        contributor.toBuffer(),
      ],
      program.programId
    )[0];
  }

  it('Is initialized!', async () => {
    const tx = await program.methods.initialize().rpc();
    console.log('Your transaction signature', tx);
  });

  it('Creates a campaign successfully', async () => {
    const name = 'Test Campaign';
    const goal = new anchor.BN(1000);
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 86400);
    const createdAt = new anchor.BN(now + testCounter++);

    const campaignPda = getCampaignPda(provider.wallet.publicKey, createdAt);
    const treasuryPda = getTreasuryPda(campaignPda);

    await program.methods
      .createCampaign(name, 'Test description', goal, deadline, createdAt)
      .accounts({
        // campaign: campaignPda,
        owner: provider.wallet.publicKey,
        // treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const campaignAccount = await program.account.campaign.fetch(campaignPda);
    expect(campaignAccount.name).to.equal(name);
    expect(campaignAccount.goal.toString()).to.equal(goal.toString());
    expect(campaignAccount.totalAmountDonated.toNumber()).to.equal(0);
    expect(campaignAccount.isCancelled).to.be.false;
  });

  it('Allows donations to active campaign', async () => {
    const goal = new anchor.BN(5000);
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 86400);
    const createdAt = new anchor.BN(now + testCounter++);

    const campaignPda = getCampaignPda(provider.wallet.publicKey, createdAt);
    const treasuryPda = getTreasuryPda(campaignPda);
    const contributorRecordPda = getContributorRecordPda(
      campaignPda,
      provider.wallet.publicKey
    );

    // Create campaign
    await program.methods
      .createCampaign(
        'Donate Test',
        'Test description',
        goal,
        deadline,
        createdAt
      )
      .accounts({
        // campaign: campaignPda,
        owner: provider.wallet.publicKey,
        // treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Donate to campaign
    const donationAmount = new anchor.BN(1_000_000);
    await program.methods
      .donateToCampaign(donationAmount)
      .accounts({
        campaign: campaignPda,
        contributor: provider.wallet.publicKey,
        // contributorRecord: contributorRecordPda,
        treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const campaignAccount = await program.account.campaign.fetch(campaignPda);
    expect(campaignAccount.totalAmountDonated.toString()).to.equal(
      donationAmount.toString()
    );
  });

  it('Allows contributor to withdraw from failed campaign', async () => {
    const goal = new anchor.BN(1_000_000_000);
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 2);
    const createdAt = new anchor.BN(now + testCounter++);

    const campaignPda = getCampaignPda(provider.wallet.publicKey, createdAt);
    const treasuryPda = getTreasuryPda(campaignPda);
    const contributorRecordPda = getContributorRecordPda(
      campaignPda,
      provider.wallet.publicKey
    );

    // Create campaign
    await program.methods
      .createCampaign(
        'Fail Campaign',
        'Test description',
        goal,
        deadline,
        createdAt
      )
      .accounts({
        // campaign: campaignPda,
        owner: provider.wallet.publicKey,
        // treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Donate small amount
    const donationAmount = new anchor.BN(100_000_000);
    await program.methods
      .donateToCampaign(donationAmount)
      .accounts({
        campaign: campaignPda,
        contributor: provider.wallet.publicKey,
        // contributorRecord: contributorRecordPda,
        treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Wait for deadline
    await new Promise(resolve => setTimeout(resolve, 3000));

    const before = await provider.connection.getBalance(
      provider.wallet.publicKey
    );

    // Withdraw if failed
    await program.methods
      .withdrawIfFailed()
      .accounts({
        // campaign: campaignPda,
        contributorRecord: contributorRecordPda,
        // contributor: provider.wallet.publicKey,
        treasury: treasuryPda,
      })
      .rpc();

    const after = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    const record = await program.account.contributorRecord.fetch(
      contributorRecordPda
    );

    expect(record.withdrawn).to.be.true;
    expect(after).to.be.greaterThan(before);
  });

  it('Allows owner to cancel campaign', async () => {
    const goal = new anchor.BN(1_000_000_000);
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 86400);
    const createdAt = new anchor.BN(now + testCounter++);

    const campaignPda = getCampaignPda(provider.wallet.publicKey, createdAt);
    const treasuryPda = getTreasuryPda(campaignPda);

    // Create campaign
    await program.methods
      .createCampaign(
        'Cancel Campaign',
        'Test description',
        goal,
        deadline,
        createdAt
      )
      .accounts({
        // campaign: campaignPda,
        owner: provider.wallet.publicKey,
        // treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Cancel campaign
    await program.methods
      .cancelCampaign()
      .accounts({
        campaign: campaignPda,
        // owner: provider.wallet.publicKey,
      })
      .rpc();

    const campaignAccount = await program.account.campaign.fetch(campaignPda);
    expect(campaignAccount.isCancelled).to.be.true;
  });

  // Negative test cases - simplified to focus on what we can currently test
  it('Prevents withdrawal from successful campaign (should fail)', async () => {
    const goal = new anchor.BN(100_000_000);
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 2);
    const createdAt = new anchor.BN(now + testCounter++);

    const campaignPda = getCampaignPda(provider.wallet.publicKey, createdAt);
    const treasuryPda = getTreasuryPda(campaignPda);
    const contributorRecordPda = getContributorRecordPda(
      campaignPda,
      provider.wallet.publicKey
    );

    // Create campaign
    await program.methods
      .createCampaign(
        'Success Fail Test',
        'Test description',
        goal,
        deadline,
        createdAt
      )
      .accounts({
        // campaign: campaignPda,
        owner: provider.wallet.publicKey,
        // treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Donate enough to reach goal
    await program.methods
      .donateToCampaign(goal)
      .accounts({
        campaign: campaignPda,
        contributor: provider.wallet.publicKey,
        // contributorRecord: contributorRecordPda,
        treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Wait for deadline
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      await program.methods
        .withdrawIfFailed()
        .accounts({
          // campaign: campaignPda,
          contributorRecord: contributorRecordPda,
          // contributor: provider.wallet.publicKey,
          treasury: treasuryPda,
        })
        .rpc();
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error.message).to.include('CampaignGoalReached');
    }
  });

  it('Allows owner to withdraw from successful campaign', async () => {
    const goal = new anchor.BN(100_000_000);
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 2);
    const createdAt = new anchor.BN(now + testCounter++);

    const campaignPda = getCampaignPda(provider.wallet.publicKey, createdAt);
    const treasuryPda = getTreasuryPda(campaignPda);
    const contributorRecordPda = getContributorRecordPda(
      campaignPda,
      provider.wallet.publicKey
    );

    // Create campaign
    await program.methods
      .createCampaign(
        'Success Campaign',
        'Test description',
        goal,
        deadline,
        createdAt
      )
      .accounts({
        // campaign: campaignPda,
        owner: provider.wallet.publicKey,
        // treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Donate to reach goal
    await program.methods
      .donateToCampaign(goal)
      .accounts({
        campaign: campaignPda,
        contributor: provider.wallet.publicKey,
        // contributorRecord: contributorRecordPda,
        treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Wait for deadline
    await new Promise(resolve => setTimeout(resolve, 3000));

    const before = await provider.connection.getBalance(
      provider.wallet.publicKey
    );

    // Owner withdraw
    await program.methods
      .withdrawByOwner()
      .accounts({
        campaign: campaignPda,
        // owner: provider.wallet.publicKey,
        treasury: treasuryPda,
      })
      .rpc();

    const after = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    const campaignAccount = await program.account.campaign.fetch(campaignPda);

    expect(campaignAccount.withdrawnByOwner).to.be.true;
    expect(after).to.be.greaterThan(before);
  });

  it('Prevents owner withdrawal from failed campaign (should fail)', async () => {
    const goal = new anchor.BN(1_000_000_000);
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 2);
    const createdAt = new anchor.BN(now + testCounter++);

    const campaignPda = getCampaignPda(provider.wallet.publicKey, createdAt);
    const treasuryPda = getTreasuryPda(campaignPda);
    const contributorRecordPda = getContributorRecordPda(
      campaignPda,
      provider.wallet.publicKey
    );

    // Create campaign
    await program.methods
      .createCampaign(
        'Owner Fail Test',
        'Test description',
        goal,
        deadline,
        createdAt
      )
      .accounts({
        // campaign: campaignPda,
        owner: provider.wallet.publicKey,
        // treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Donate less than goal
    await program.methods
      .donateToCampaign(new anchor.BN(100_000_000))
      .accounts({
        campaign: campaignPda,
        contributor: provider.wallet.publicKey,
        // contributorRecord: contributorRecordPda,
        treasury: treasuryPda,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Wait for deadline
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      await program.methods
        .withdrawByOwner()
        .accounts({
          campaign: campaignPda,
          // owner: provider.wallet.publicKey,
          treasury: treasuryPda,
        })
        .rpc();
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error.message).to.include('CampaignGoalNotReached');
    }
  });
});
